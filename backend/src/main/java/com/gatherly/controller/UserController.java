package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.common.PageMeta;
import com.gatherly.dto.user.ChangePasswordRequest;
import com.gatherly.dto.user.SelfUpdateRequest;
import com.gatherly.dto.user.UserCreateRequest;
import com.gatherly.dto.user.UserResponse;
import com.gatherly.dto.user.UserUpdateRequest;
import com.gatherly.security.UserPrincipal;
import com.gatherly.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * User management ({@code docs/03} §4.2). Thin: each method delegates to one {@link UserService}
 * call whose {@code @PreAuthorize} gate is the real authority. The {@code /me} routes are
 * self-scoped; {@code /users} routes are Admin-only.
 */
@RestController
public class UserController {

  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  // ── Admin CRUD ──────────────────────────────────────────────────────────────

  @GetMapping("/users")
  public ApiResponse<List<UserResponse>> list(
      @RequestParam(required = false) String q, @PageableDefault(size = 20) Pageable pageable) {
    Page<UserResponse> page = userService.search(q, pageable);
    return ApiResponse.page(
        "Users retrieved successfully.", page.getContent(), PageMeta.from(page));
  }

  @PostMapping("/users")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<UserResponse> create(@Valid @RequestBody UserCreateRequest request) {
    return ApiResponse.ok("User created successfully.", userService.create(request));
  }

  @GetMapping("/users/{userId}")
  public ApiResponse<UserResponse> get(@PathVariable UUID userId) {
    return ApiResponse.ok("User retrieved successfully.", userService.get(userId));
  }

  @PutMapping("/users/{userId}")
  public ApiResponse<UserResponse> update(
      @PathVariable UUID userId, @Valid @RequestBody UserUpdateRequest request) {
    return ApiResponse.ok("User updated successfully.", userService.update(userId, request));
  }

  @DeleteMapping("/users/{userId}")
  public ApiResponse<Void> delete(
      @PathVariable UUID userId, @AuthenticationPrincipal UserPrincipal principal) {
    userService.delete(userId, principal.id());
    return ApiResponse.ok("User deleted successfully.");
  }

  // ── Self-profile ────────────────────────────────────────────────────────────

  @GetMapping("/me")
  public ApiResponse<UserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.ok("Profile retrieved successfully.", userService.getSelf(principal.id()));
  }

  @PutMapping("/me")
  public ApiResponse<UserResponse> updateMe(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody SelfUpdateRequest request) {
    return ApiResponse.ok(
        "Profile updated successfully.", userService.updateSelf(principal.id(), request));
  }

  @PutMapping("/me/password")
  public ApiResponse<Void> changePassword(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody ChangePasswordRequest request) {
    userService.changePassword(principal.id(), request);
    return ApiResponse.ok("Password changed successfully.");
  }
}
