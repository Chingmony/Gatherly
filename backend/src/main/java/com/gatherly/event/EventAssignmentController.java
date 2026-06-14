package com.gatherly.event;

import com.gatherly.event.dto.AssignMemberRequest;
import com.gatherly.event.dto.AssignmentResponse;
import com.gatherly.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Event membership / delegation (docs/03 §4.5). Thin controller; the event-scoped gates and the
 * Admin-only MANAGER rules live on {@link EventAssignmentService}.
 */
@RestController
@RequestMapping("/api/v1/events/{eventId}/assignments")
public class EventAssignmentController {

    private final EventAssignmentService assignmentService;

    public EventAssignmentController(EventAssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @GetMapping
    public List<AssignmentResponse> list(@PathVariable UUID eventId) {
        return assignmentService.list(eventId);
    }

    @PostMapping
    public ResponseEntity<AssignmentResponse> assign(@PathVariable UUID eventId,
                                                     @Valid @RequestBody AssignMemberRequest req,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        AssignmentResponse body = assignmentService.assign(eventId, req, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @DeleteMapping("/{assignmentId}")
    public ResponseEntity<Void> remove(@PathVariable UUID eventId, @PathVariable UUID assignmentId,
                                       @AuthenticationPrincipal UserPrincipal principal) {
        assignmentService.remove(eventId, assignmentId, principal);
        return ResponseEntity.noContent().build();
    }
}
