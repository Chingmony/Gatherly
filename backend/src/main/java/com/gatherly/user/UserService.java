package com.gatherly.user;

import com.gatherly.common.error.AppException;
import com.gatherly.common.error.DomainConflictException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.error.NotFoundException;
import com.gatherly.event.EventAssignmentRepository;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.User;
import com.gatherly.user.domain.UserStatus;
import com.gatherly.user.dto.ChangePasswordRequest;
import com.gatherly.user.dto.InviteUserRequest;
import com.gatherly.user.dto.UpdateProfileRequest;
import com.gatherly.user.dto.UpdateUserRequest;
import com.gatherly.user.dto.UserScope;
import com.gatherly.user.event.UserCreatedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * User management (docs/06 §3). Reads (list/get/scope) are open to any authenticated user so
 * organizers can view the team roster read-only; all mutations (invite/update/delete) stay
 * Admin-only. Authorization gates live here on the service layer (docs/06 §1).
 */
@Service
@Transactional
public class UserService {

    private final UserRepository users;
    private final EventAssignmentRepository assignments;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher events;
    private final com.gatherly.audit.AuditService auditService;

    public UserService(UserRepository users, EventAssignmentRepository assignments,
                       PasswordEncoder passwordEncoder, ApplicationEventPublisher events,
                       com.gatherly.audit.AuditService auditService) {
        this.users = users;
        this.assignments = assignments;
        this.passwordEncoder = passwordEncoder;
        this.events = events;
        this.auditService = auditService;
    }

    // ---- Admin global CRUD (docs/03 §4.2) -----------------------------------

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public Page<User> list(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return users.findAll(pageable);
        }
        return users.findByEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(query, query, pageable);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public User get(UUID userId) {
        return findOrThrow(userId);
    }

    /**
     * Event-assignment scope for a page of users (docs/03 §4.2) — one grouped query, not N counts.
     * Users with no assignments are absent from the map (caller treats absent as {@link UserScope#NONE}).
     */
    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public Map<UUID, UserScope> scopeFor(Collection<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        return assignments.scopeByUserIds(userIds).stream().collect(Collectors.toMap(
                EventAssignmentRepository.UserScopeProjection::getUserId,
                p -> new UserScope(p.getCnt(), p.getCnt() == 1 ? p.getTitle() : null)));
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
        // An Admin has no event-role designation; otherwise honour the chosen Sub-admin/Handler tier.
        u.setDefaultEventRole(req.globalRole() == GlobalRole.ADMIN ? null : req.defaultEventRole());
        u.setStatus(req.status());
        return users.save(u);
    }

    /**
     * Hard-delete a user (Admin-only; Sub-admins forbidden, docs/00 §5). Refresh tokens cascade.
     * A user still referenced by events/materials (M2+) is protected by FK constraints — that
     * surfaces as a {@code 409 CONFLICT}, at which point deactivation is the appropriate fallback.
     */
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(UUID userId) {
        User u = findOrThrow(userId);
        users.delete(u);
        auditService.record("USER_DELETED", "USER", userId, "email=" + u.getEmail());
    }

    /** Deactivate (soft) — keep an active user out without removing the record (docs/02 §1). */
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
