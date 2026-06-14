package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.dto.assignment.AssignmentCreateRequest;
import com.gatherly.dto.assignment.AssignmentResponse;
import com.gatherly.security.UserPrincipal;
import com.gatherly.service.EventAssignmentService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Event delegation ({@code docs/03} §4.5). Gates live on {@link EventAssignmentService}. */
@RestController
@RequestMapping("/events/{eventId}/assignments")
public class EventAssignmentController {

  private final EventAssignmentService assignmentService;

  public EventAssignmentController(EventAssignmentService assignmentService) {
    this.assignmentService = assignmentService;
  }

  @GetMapping
  public ApiResponse<List<AssignmentResponse>> list(@PathVariable UUID eventId) {
    return ApiResponse.ok("Assignments retrieved successfully.", assignmentService.list(eventId));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<AssignmentResponse> create(
      @PathVariable UUID eventId,
      @Valid @RequestBody AssignmentCreateRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.ok(
        "Assignment created successfully.", assignmentService.create(eventId, request, principal));
  }

  @DeleteMapping("/{assignmentId}")
  public ApiResponse<Void> revoke(@PathVariable UUID eventId, @PathVariable UUID assignmentId) {
    assignmentService.revoke(eventId, assignmentId);
    return ApiResponse.ok("Assignment revoked successfully.");
  }
}
