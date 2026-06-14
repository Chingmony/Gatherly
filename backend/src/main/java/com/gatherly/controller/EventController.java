package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.common.PageMeta;
import com.gatherly.dto.event.EventCreateRequest;
import com.gatherly.dto.event.EventResponse;
import com.gatherly.dto.event.EventUpdateRequest;
import com.gatherly.security.UserPrincipal;
import com.gatherly.service.EventService;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Events ({@code docs/03} §4.4). Thin: each method delegates to one {@link EventService} call whose
 * {@code @PreAuthorize} gate is the authority.
 */
@RestController
@RequestMapping("/events")
public class EventController {

  private final EventService eventService;

  public EventController(EventService eventService) {
    this.eventService = eventService;
  }

  @GetMapping
  public ApiResponse<List<EventResponse>> list(
      @RequestParam(required = false) String q,
      @PageableDefault(size = 20) Pageable pageable,
      @AuthenticationPrincipal UserPrincipal principal) {
    Page<EventResponse> page = eventService.list(q, pageable, principal);
    return ApiResponse.page(
        "Events retrieved successfully.", page.getContent(), PageMeta.from(page));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<EventResponse> create(
      @Valid @RequestBody EventCreateRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.ok("Event created successfully.", eventService.create(request, principal));
  }

  @GetMapping("/{eventId}")
  public ApiResponse<EventResponse> get(@PathVariable UUID eventId) {
    return ApiResponse.ok("Event retrieved successfully.", eventService.get(eventId));
  }

  @PutMapping("/{eventId}")
  public ApiResponse<EventResponse> update(
      @PathVariable UUID eventId, @Valid @RequestBody EventUpdateRequest request) {
    return ApiResponse.ok("Event updated successfully.", eventService.update(eventId, request));
  }

  @PostMapping("/{eventId}/publish")
  public ApiResponse<EventResponse> publish(@PathVariable UUID eventId) {
    return ApiResponse.ok("Event published.", eventService.publish(eventId));
  }

  @PostMapping("/{eventId}/archive")
  public ApiResponse<EventResponse> archive(@PathVariable UUID eventId) {
    return ApiResponse.ok("Event archived.", eventService.archive(eventId));
  }

  @DeleteMapping("/{eventId}")
  public ApiResponse<Void> delete(@PathVariable UUID eventId) {
    eventService.delete(eventId);
    return ApiResponse.ok("Event deleted successfully.");
  }

  @PostMapping("/{eventId}/registration-qr/rotate")
  public ApiResponse<EventResponse> rotateRegistrationQr(@PathVariable UUID eventId) {
    return ApiResponse.ok(
        "Registration QR token rotated.", eventService.rotateRegistrationQr(eventId));
  }
}
