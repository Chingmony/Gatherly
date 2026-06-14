package com.gatherly.service;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.EventAssignment;
import com.gatherly.domain.User;
import com.gatherly.dto.assignment.AssignmentCreateRequest;
import com.gatherly.dto.assignment.AssignmentResponse;
import com.gatherly.repository.EventAssignmentRepository;
import com.gatherly.repository.EventRepository;
import com.gatherly.repository.UserRepository;
import com.gatherly.security.UserPrincipal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link EventAssignmentService} implementation — the second authz layer in action.
 * {@code @PreAuthorize} gates map {@code docs/03} §4.5: appointing a MANAGER (Sub-admin) is
 * Admin-only; adding a HANDLER needs manage rights; removing a MANAGER is Admin-only.
 */
@Service
public class EventAssignmentServiceImpl implements EventAssignmentService {

  private final EventAssignmentRepository assignmentRepository;
  private final EventRepository eventRepository;
  private final UserRepository userRepository;

  public EventAssignmentServiceImpl(
      EventAssignmentRepository assignmentRepository,
      EventRepository eventRepository,
      UserRepository userRepository) {
    this.assignmentRepository = assignmentRepository;
    this.eventRepository = eventRepository;
    this.userRepository = userRepository;
  }

  @Override
  @PreAuthorize("@eventSecurity.canView(#eventId, authentication)")
  @Transactional(readOnly = true)
  public List<AssignmentResponse> list(UUID eventId) {
    List<EventAssignment> assignments = assignmentRepository.findByEventId(eventId);
    Map<UUID, User> usersById =
        userRepository
            .findAllById(assignments.stream().map(EventAssignment::getUserId).toList())
            .stream()
            .collect(Collectors.toMap(User::getId, Function.identity()));
    return assignments.stream().map(a -> toResponse(a, usersById.get(a.getUserId()))).toList();
  }

  @Override
  @PreAuthorize(
      "#request.eventRole().name() == 'MANAGER'"
          + " ? hasRole('ADMIN')"
          + " : @eventSecurity.canManage(#eventId, authentication)")
  @Transactional
  public AssignmentResponse create(
      UUID eventId, AssignmentCreateRequest request, UserPrincipal principal) {
    if (!eventRepository.existsById(eventId)) {
      throw new ApiException(ErrorCode.NOT_FOUND, "Event not found.");
    }
    User user =
        userRepository
            .findById(request.userId())
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found."));
    if (assignmentRepository.existsByEventIdAndUserId(eventId, request.userId())) {
      throw new ApiException(ErrorCode.CONFLICT, "User is already assigned to this event.");
    }
    EventAssignment assignment = new EventAssignment();
    assignment.setEventId(eventId);
    assignment.setUserId(request.userId());
    assignment.setEventRole(request.eventRole());
    assignment.setAssignedBy(principal.id());
    return toResponse(assignmentRepository.save(assignment), user);
  }

  @Override
  @PreAuthorize("@eventSecurity.canRemoveAssignment(#assignmentId, authentication)")
  @Transactional
  public void revoke(UUID eventId, UUID assignmentId) {
    EventAssignment assignment =
        assignmentRepository
            .findById(assignmentId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Assignment not found."));
    if (!assignment.getEventId().equals(eventId)) {
      throw new ApiException(ErrorCode.NOT_FOUND, "Assignment not found for this event.");
    }
    assignmentRepository.delete(assignment);
  }

  private AssignmentResponse toResponse(EventAssignment a, User user) {
    return new AssignmentResponse(
        a.getId(),
        a.getEventId(),
        a.getUserId(),
        user == null ? null : user.getEmail(),
        user == null ? null : user.getFullName(),
        a.getEventRole(),
        a.getAssignedBy(),
        a.getCreatedAt());
  }
}
