package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.dto.assignment.AssignmentCreateRequest;
import com.gatherly.dto.assignment.AssignmentResponse;
import com.gatherly.security.UserPrincipal;
import com.gatherly.service.EventAssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(
    name = "Event Assignments",
    description =
        "Event-scoped role delegation: appoint MANAGERs (Admin only) and HANDLERs (Admin or the"
            + " event MANAGER) to an event, and revoke those assignments.")
@RestController
@RequestMapping("/events/{eventId}/assignments")
public class EventAssignmentController {

  private final EventAssignmentService assignmentService;

  public EventAssignmentController(EventAssignmentService assignmentService) {
    this.assignmentService = assignmentService;
  }

  @Operation(
      summary = "List event assignments",
      description =
          "Returns the users assigned to the event with their event-scoped roles (MANAGER /"
              + " HANDLER). Visible to ADMIN or anyone assigned to the event. Errors: 403 FORBIDDEN.")
  @GetMapping
  public ApiResponse<List<AssignmentResponse>> list(@PathVariable UUID eventId) {
    return ApiResponse.ok("Assignments retrieved successfully.", assignmentService.list(eventId));
  }

  @Operation(
      summary = "Assign a user to the event",
      description =
          "Appoints a user as MANAGER or HANDLER on the event. Appointing a MANAGER (Sub-admin) is"
              + " ADMIN-only; adding a HANDLER requires manage rights (ADMIN or the event MANAGER)."
              + " Errors: 403 FORBIDDEN; 404 NOT_FOUND if event/user is unknown; 409 CONFLICT if the"
              + " user is already assigned to this event.")
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<AssignmentResponse> create(
      @PathVariable UUID eventId,
      @Valid @RequestBody AssignmentCreateRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.ok(
        "Assignment created successfully.", assignmentService.create(eventId, request, principal));
  }

  @Operation(
      summary = "Revoke an event assignment",
      description =
          "Removes an assignment. Revoking a MANAGER is ADMIN-only; revoking a HANDLER requires"
              + " manage rights (ADMIN or the event MANAGER). Errors: 403 FORBIDDEN; 404 NOT_FOUND"
              + " if the assignment does not exist or does not belong to this event.")
  @DeleteMapping("/{assignmentId}")
  public ApiResponse<Void> revoke(@PathVariable UUID eventId, @PathVariable UUID assignmentId) {
    assignmentService.revoke(eventId, assignmentId);
    return ApiResponse.ok("Assignment revoked successfully.");
  }
}
