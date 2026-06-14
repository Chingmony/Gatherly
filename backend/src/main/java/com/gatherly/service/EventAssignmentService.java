package com.gatherly.service;

import com.gatherly.dto.assignment.AssignmentCreateRequest;
import com.gatherly.dto.assignment.AssignmentResponse;
import com.gatherly.security.UserPrincipal;
import java.util.List;
import java.util.UUID;

/** Event membership / delegation ({@code docs/03} §4.5, {@code docs/06} §3). */
public interface EventAssignmentService {

  List<AssignmentResponse> list(UUID eventId);

  AssignmentResponse create(UUID eventId, AssignmentCreateRequest request, UserPrincipal principal);

  void revoke(UUID eventId, UUID assignmentId);
}
