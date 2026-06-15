package com.gatherly.event;

import com.gatherly.common.error.DomainConflictException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.error.NotFoundException;
import com.gatherly.event.domain.EventAssignment;
import com.gatherly.event.domain.EventRole;
import com.gatherly.event.dto.AssignMemberRequest;
import com.gatherly.event.dto.AssignmentResponse;
import com.gatherly.event.dto.CandidateResponse;
import com.gatherly.security.UserPrincipal;
import com.gatherly.user.UserRepository;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Event delegation / membership (docs/06 §3, docs/03 §4.5) — the "Members" + "Assign Handler"
 * surfaces. Realizes the two-layer model: the {@code canManage} gate lets Admins and event
 * MANAGERs add Handlers, but the two MANAGER-level actions (appoint a Sub-admin, remove a
 * Sub-admin) are hard Admin-only inside the service — a Sub-admin can never elevate another user
 * to Sub-admin (docs/00 §5, docs/03 §4.5).
 */
@Service
@Transactional
public class EventAssignmentService {

    private final EventAssignmentRepository assignments;
    private final EventRepository events;
    private final UserRepository users;

    public EventAssignmentService(EventAssignmentRepository assignments, EventRepository events,
                                  UserRepository users) {
        this.assignments = assignments;
        this.events = events;
        this.users = users;
    }

    @PreAuthorize("@eventSecurity.canView(#eventId, authentication)")
    @Transactional(readOnly = true)
    public List<AssignmentResponse> list(UUID eventId) {
        requireEvent(eventId);
        List<EventAssignment> rows = assignments.findByEventId(eventId);
        Map<UUID, User> byId = users.findAllById(rows.stream().map(EventAssignment::getUserId).toList())
                .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        return rows.stream().map(a -> toResponse(a, byId.get(a.getUserId()))).toList();
    }

    /**
     * Assignable directory for the member picker (docs/03 §4.5) — every non-admin user, so an event
     * MANAGER (Sub-admin) can delegate Handlers on their own event without the Admin-only {@code /users}
     * directory. Same {@code canManage} gate as {@link #assign}; the caller filters already-assigned.
     */
    @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
    @Transactional(readOnly = true)
    public List<CandidateResponse> assignableUsers(UUID eventId) {
        requireEvent(eventId);
        return users.findByGlobalRoleOrderByFullNameAsc(GlobalRole.MEMBER).stream()
                .map(u -> new CandidateResponse(u.getId(), u.getFullName(), u.getEmail()))
                .toList();
    }

    @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
    public AssignmentResponse assign(UUID eventId, AssignMemberRequest req, UserPrincipal actor) {
        requireEvent(eventId);
        EventRole role = req.role().toEventRole();
        // Appointing a Sub-admin (MANAGER) is Admin-only, even though canManage passed (docs/03 §4.5).
        if (role == EventRole.MANAGER && !isAdmin(actor)) {
            throw new AccessDeniedException("Only an admin can appoint a Sub-admin.");
        }
        User target = users.findById(req.userId())
                .orElseThrow(() -> new NotFoundException("User not found."));
        if (assignments.existsByEventIdAndUserId(eventId, req.userId())) {
            throw new DomainConflictException(ErrorCode.CONFLICT, "User is already assigned to this event.");
        }
        EventAssignment saved = assignments.save(
                new EventAssignment(eventId, req.userId(), role, actor == null ? null : actor.id()));
        return toResponse(saved, target);
    }

    @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
    public void remove(UUID eventId, UUID assignmentId, UserPrincipal actor) {
        EventAssignment a = assignments.findById(assignmentId)
                .orElseThrow(() -> new NotFoundException("Assignment not found."));
        if (!a.getEventId().equals(eventId)) {
            throw new NotFoundException("Assignment not found."); // don't leak cross-event existence
        }
        // Removing a Sub-admin (MANAGER) is Admin-only (docs/03 §4.5).
        if (a.getEventRole() == EventRole.MANAGER && !isAdmin(actor)) {
            throw new AccessDeniedException("Only an admin can remove a Sub-admin.");
        }
        assignments.delete(a);
    }

    private AssignmentResponse toResponse(EventAssignment a, User u) {
        return new AssignmentResponse(
                a.getId(), a.getUserId(),
                u == null ? null : u.getFullName(),
                u == null ? null : u.getEmail(),
                a.getEventRole(), a.getAssignedBy(), a.getCreatedAt());
    }

    private void requireEvent(UUID eventId) {
        if (!events.existsById(eventId)) {
            throw new NotFoundException("Event not found.");
        }
    }

    // Type-safe global-admin check on the principal's GlobalRole — kept consistent by construction
    // with EventSecurityService's authority check (UserPrincipal.authority() == "ROLE_" + role.name()),
    // so the Admin-only MANAGER appoint/remove guards above can never drift on a string mismatch.
    private boolean isAdmin(UserPrincipal actor) {
        return actor != null && actor.role() == GlobalRole.ADMIN;
    }
}
