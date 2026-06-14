package com.gatherly.user;

import com.gatherly.common.error.AppException;
import com.gatherly.common.error.DomainConflictException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.error.NotFoundException;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.User;
import com.gatherly.user.domain.UserStatus;
import com.gatherly.user.dto.ChangePasswordRequest;
import com.gatherly.user.dto.InviteUserRequest;
import com.gatherly.user.dto.UpdateProfileRequest;
import com.gatherly.user.dto.UpdateUserRequest;
import com.gatherly.user.event.UserCreatedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * User management (docs/06 §3). Admin-only global CRUD plus self-service profile/password.
 * Authorization gates live here on the service layer (docs/06 §1); delete is a deactivation
 * ({@code status=INACTIVE}), never a hard delete (docs/02 §1).
 */
@Service
@Transactional
public class UserService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher events;

    public UserService(UserRepository users, PasswordEncoder passwordEncoder,
                       ApplicationEventPublisher events) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.events = events;
    }

    // ---- Admin global CRUD (docs/03 §4.2) -----------------------------------

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Page<User> list(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return users.findAll(pageable);
        }
        return users.findByEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(query, query, pageable);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public User get(UUID userId) {
        return findOrThrow(userId);
    }

    /**
     * Invite a user (docs/06 §3a): create a passwordless {@code MEMBER} in {@code PENDING_ACTIVATION}
     * with the chosen Sub-admin/Handler designation, then publish {@link UserCreatedEvent} so the
     * activation email is sent after commit. The Admin never sets the user's password.
     */
    @PreAuthorize("hasRole('ADMIN')")
    public User invite(InviteUserRequest req) {
        if (users.existsByEmailIgnoreCase(req.email())) {
            throw new DomainConflictException(ErrorCode.CONFLICT, "Email already in use.");
        }
        User u = new User();
        u.setEmail(req.email().toLowerCase());
        u.setFullName(req.fullName());
        u.setGlobalRole(GlobalRole.MEMBER);            // invite never mints a global Admin
        u.setDefaultEventRole(req.role().toEventRole()); // SUB_ADMIN→MANAGER, HANDLER→HANDLER
        u.setStatus(UserStatus.PENDING_ACTIVATION);    // no password until activation
        User saved = users.save(u);
        events.publishEvent(new UserCreatedEvent(saved.getId(), saved.getEmail(), saved.getFullName()));
        return saved;
    }

    @PreAuthorize("hasRole('ADMIN')")
    public User update(UUID userId, UpdateUserRequest req) {
        User u = findOrThrow(userId);
        u.setFullName(req.fullName());
        u.setPhone(req.phone());
        u.setGender(req.gender());
        u.setDateOfBirth(req.dateOfBirth());
        u.setAddress(req.address());
        u.setGlobalRole(req.globalRole());
        u.setStatus(req.status());
        return users.save(u);
    }

    /** Deactivate (soft delete). Sub-admins are forbidden — gate is Admin-only (docs/00 §5). */
    @PreAuthorize("hasRole('ADMIN')")
    public void deactivate(UUID userId) {
        User u = findOrThrow(userId);
        u.setStatus(UserStatus.INACTIVE);
        users.save(u);
    }

    // ---- Self-service (docs/03 §4.2) ----------------------------------------

    @Transactional(readOnly = true)
    public User getById(UUID userId) {
        return findOrThrow(userId);
    }

    public User updateProfile(UUID userId, UpdateProfileRequest req) {
        User u = findOrThrow(userId);
        u.setFullName(req.fullName());
        u.setPhone(req.phone());
        u.setGender(req.gender());
        u.setDateOfBirth(req.dateOfBirth());
        u.setAddress(req.address());
        return users.save(u);
    }

    public void changePassword(UUID userId, ChangePasswordRequest req) {
        User u = findOrThrow(userId);
        if (!passwordEncoder.matches(req.currentPassword(), u.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "Current password is incorrect.");
        }
        u.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        users.save(u);
    }

    private User findOrThrow(UUID userId) {
        return users.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found."));
    }
}
