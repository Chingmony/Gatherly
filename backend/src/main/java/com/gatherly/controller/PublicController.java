package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.common.PageMeta;
import com.gatherly.common.paging.PageRequests;
import com.gatherly.dto.event.EventSort;
import com.gatherly.dto.event.PublicEventResponse;
import com.gatherly.dto.registration.PublicFormResponse;
import com.gatherly.dto.registration.RegistrationRequest;
import com.gatherly.dto.registration.RegistrationResponse;
import com.gatherly.dto.registration.TicketResponse;
import com.gatherly.service.EventService;
import com.gatherly.service.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public guest surface ({@code docs/03} §4.9) — unauthenticated ({@code permitAll} on {@code
 * /public/**}). Guests register only here; attendance is confirmed by an organizer scan (M7).
 */
@Tag(
    name = "Public Registration",
    description =
        "Unauthenticated guest surface: resolve a poster QR, fetch a published event's form,"
            + " register to receive a QR ticket by email, and view/resend a ticket. Only PUBLIC"
            + " events are exposed; non-public events return 404 to avoid leaking them.")
@RestController
@RequestMapping("/public")
public class PublicController {

  private final RegistrationService registrationService;
  private final EventService eventService;

  public PublicController(RegistrationService registrationService, EventService eventService) {
    this.registrationService = registrationService;
    this.eventService = eventService;
  }

  @Operation(
      summary = "List public events",
      description =
          "Unauthenticated discovery list of PUBLIC events. Query params: `search` (matches event"
              + " title, case-insensitive), `from` / `to` (ISO-8601 instants bounding the event"
              + " start time, e.g. 2026-06-14T00:00:00Z), `page` (default 0), `size` (default 20,"
              + " max 100), `sort` = DATE | NAME | STATUS | CREATED_AT (default DATE = start time),"
              + " `direction` = ASC | DESC (default ASC). Only PUBLIC events are returned.")
  @GetMapping("/events")
  public ApiResponse<List<PublicEventResponse>> listEvents(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          Instant from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "DATE") EventSort sort,
      @RequestParam(defaultValue = "ASC") Sort.Direction direction) {
    Pageable pageable = PageRequests.of(page, size, sort, direction);
    Page<PublicEventResponse> result = eventService.listPublic(search, from, to, pageable);
    return ApiResponse.page(
        "Events retrieved successfully.", result.getContent(), PageMeta.from(result));
  }

  @Operation(
      summary = "Resolve a poster registration-QR token",
      description =
          "Maps a printed poster's registration-QR `token` to its public event form. Public."
              + " Errors: 404 NOT_FOUND if the token is unknown or the event is not PUBLIC.")
  @GetMapping("/r/resolve")
  public ApiResponse<PublicFormResponse> resolvePoster(@RequestParam("token") String token) {
    return ApiResponse.ok("Event resolved.", registrationService.resolvePoster(token));
  }

  @Operation(
      summary = "Get a public event's registration form",
      description =
          "Returns the active registration form for a PUBLIC event by slug, for guests to fill in."
              + " Public. Errors: 404 NOT_FOUND if the slug is unknown/not public; 409 NO_ACTIVE_FORM"
              + " if the event has no active form.")
  @GetMapping("/events/{slug}/form")
  public ApiResponse<PublicFormResponse> form(@PathVariable String slug) {
    return ApiResponse.ok("Form retrieved successfully.", registrationService.getPublicForm(slug));
  }

  @Operation(
      summary = "Register for an event",
      description =
          "Submits guest answers (validated server-side against the active form schema; `email` and"
              + " `phone` always required) and mints a personal QR ticket emailed after commit. A"
              + " duplicate email re-sends the existing ticket (one ticket per email per event)."
              + " Public. Errors: 400 VALIDATION_ERROR for bad answers; 404 NOT_FOUND if the event"
              + " is unknown/not public; 409 NO_ACTIVE_FORM; 429 RATE_LIMITED when throttled.")
  @PostMapping("/events/{eventId}/register")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<RegistrationResponse> register(
      @PathVariable UUID eventId, @Valid @RequestBody RegistrationRequest request) {
    return ApiResponse.ok("Registration received.", registrationService.register(eventId, request));
  }

  @Operation(
      summary = "View a ticket",
      description =
          "Returns ticket details and an inline QR image (data URL) for a guest's check-in token —"
              + " the on-screen fallback to the emailed QR. Public. Errors: 404 NOT_FOUND for an"
              + " unknown token.")
  @GetMapping("/tickets/{checkinToken}")
  public ApiResponse<TicketResponse> ticket(@PathVariable String checkinToken) {
    return ApiResponse.ok(
        "Ticket retrieved successfully.", registrationService.getTicket(checkinToken));
  }

  @Operation(
      summary = "Resend a ticket email",
      description =
          "Re-sends the QR-ticket email for a guest's check-in token. Public. Errors: 404 NOT_FOUND"
              + " for an unknown token; 409 TICKET_INVALID if the ticket is already checked-in or"
              + " revoked.")
  @PostMapping("/tickets/{checkinToken}/resend")
  public ApiResponse<RegistrationResponse> resend(@PathVariable String checkinToken) {
    return ApiResponse.ok("Ticket re-sent.", registrationService.resend(checkinToken));
  }
}
