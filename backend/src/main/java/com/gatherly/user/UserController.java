package com.gatherly.user;

import com.gatherly.common.PageResponse;
import com.gatherly.common.error.DomainConflictException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.security.UserPrincipal;
import com.gatherly.user.domain.User;
import com.gatherly.user.dto.ChangePasswordRequest;
import com.gatherly.user.dto.InviteUserRequest;
import com.gatherly.user.dto.UpdateProfileRequest;
import com.gatherly.user.dto.UpdateUserRequest;
import com.gatherly.user.dto.UserResponse;
import com.gatherly.user.dto.UserScope;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * User endpoints (docs/03 §4.2). Thin controller: validates, delegates to {@link UserService}
 * (which owns the {@code @PreAuthorize} gates), maps to DTOs. {@code /me*} acts on the caller's
 * own principal, so it is inherently self-scoped.
 */
@RestController
@RequestMapping("/api/v1")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ---- Admin global CRUD --------------------------------------------------

    @GetMapping("/users")
    public PageResponse<UserResponse> list(@RequestParam(required = false) String query,
                                           @PageableDefault(size = 20) Pageable pageable) {
        Page<User> page = userService.list(query, pageable);
        Map<UUID, UserScope> scopes = userService.scopeFor(page.getContent().stream().map(User::getId).toList());
        return PageResponse.of(page, u -> UserMapper.toResponse(u, scopes.get(u.getId())));
    }

    @PostMapping("/users")
    public ResponseEntity<UserResponse> invite(@Valid @RequestBody InviteUserRequest req) {
        UserResponse body = UserMapper.toResponse(userService.invite(req));
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/users/{userId}")
    public UserResponse get(@PathVariable UUID userId) {
        User u = userService.get(userId);
        UserScope scope = userService.scopeFor(List.of(userId)).get(userId);
        return UserMapper.toResponse(u, scope);
    }

    @PutMapping("/users/{userId}")
    public UserResponse update(@PathVariable UUID userId, @Valid @RequestBody UpdateUserRequest req) {
        return UserMapper.toResponse(userService.update(userId, req));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> delete(@PathVariable UUID userId,
                                       @AuthenticationPrincipal UserPrincipal principal) {
        if (principal != null && principal.id().equals(userId)) {
            throw new DomainConflictException(ErrorCode.CONFLICT, "You cannot delete your own account.");
        }
        userService.delete(userId);
        return ResponseEntity.noContent().build();
    }

    // ---- Self-service -------------------------------------------------------

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal UserPrincipal principal) {
        return UserMapper.toResponse(userService.getById(principal.id()));
    }

    @PutMapping("/me")
    public UserResponse updateMe(@AuthenticationPrincipal UserPrincipal principal,
                                 @Valid @RequestBody UpdateProfileRequest req) {
        return UserMapper.toResponse(userService.updateProfile(principal.id(), req));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal UserPrincipal principal,
                                               @Valid @RequestBody ChangePasswordRequest req) {
        userService.changePassword(principal.id(), req);
        return ResponseEntity.noContent().build();
    }
}
