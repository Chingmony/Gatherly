package com.gatherly.event;

import com.gatherly.common.PageResponse;
import com.gatherly.event.dto.CreateEventRequest;
import com.gatherly.event.dto.EventResponse;
import com.gatherly.event.dto.UpdateEventRequest;
import com.gatherly.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Event endpoints (docs/03 §4.4). Thin controller: validates, delegates to {@link EventService}
 * (which owns the {@code @PreAuthorize} gates and lifecycle invariants), maps to DTOs. {@code GET
 * /events} is authenticated and service-scoped to the caller; all other operations carry an
 * explicit gate on the service method.
 */
@RestController
@RequestMapping("/api/v1/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public PageResponse<EventResponse> list(@RequestParam(required = false) String query,
                                            @PageableDefault(size = 20) Pageable pageable,
                                            @AuthenticationPrincipal UserPrincipal principal) {
        return PageResponse.of(eventService.list(query, pageable, principal), EventMapper::toResponse);
    }

    @PostMapping
    public ResponseEntity<EventResponse> create(@Valid @RequestBody CreateEventRequest req,
                                                @AuthenticationPrincipal UserPrincipal principal) {
        EventResponse body = EventMapper.toResponse(eventService.create(req, principal));
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @GetMapping("/{eventId}")
    public EventResponse get(@PathVariable UUID eventId) {
        return EventMapper.toResponse(eventService.get(eventId));
    }

    @PutMapping("/{eventId}")
    public EventResponse update(@PathVariable UUID eventId, @Valid @RequestBody UpdateEventRequest req) {
        return EventMapper.toResponse(eventService.update(eventId, req));
    }

    @PostMapping("/{eventId}/publish")
    public EventResponse publish(@PathVariable UUID eventId) {
        return EventMapper.toResponse(eventService.publish(eventId));
    }

    @PostMapping("/{eventId}/archive")
    public EventResponse archive(@PathVariable UUID eventId) {
        return EventMapper.toResponse(eventService.archive(eventId));
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> delete(@PathVariable UUID eventId) {
        eventService.delete(eventId);
        return ResponseEntity.noContent().build();
    }
}
