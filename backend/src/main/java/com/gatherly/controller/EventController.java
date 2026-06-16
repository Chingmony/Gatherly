package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.common.PageMeta;
import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.paging.PageRequests;
import com.gatherly.dto.event.EventCreateRequest;
import com.gatherly.dto.event.EventResponse;
import com.gatherly.dto.event.EventSort;
import com.gatherly.dto.event.EventUpdateRequest;
import com.gatherly.security.UserPrincipal;
import com.gatherly.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;

/**
 * Events ({@code docs/03} §4.4). Thin: each method delegates to one {@link EventService} call whose
 * {@code @PreAuthorize} gate is the authority.
 */
@Tag(
    name = "Events",
    description =
        "Event lifecycle (DRAFT → PUBLIC → ARCHIVED) and CRUD. Listing is role-scoped; create,"
            + " publish, archive, delete, and QR rotation are ADMIN-only; editing is allowed for"
            + " the event's MANAGER.")
@RestController
@RequestMapping("/events")
public class EventController {

  private final EventService eventService;

  public EventController(EventService eventService) {
    this.eventService = eventService;
  }

  @Operation(
      summary = "List events",
      description =
          "Role-scoped paginated list: ADMIN sees all events; others see only events they are"
              + " assigned to (MANAGER or HANDLER). Query params: `search` (matches event title),"
              + " `page` (default 0), `size` (default 20, max 100), `sort` = DATE | NAME | STATUS |"
              + " CREATED_AT (default DATE = start time), `direction` = ASC | DESC (default ASC).")
  @GetMapping
  public ApiResponse<List<EventResponse>> list(
      @RequestParam(required = false) String search,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "DATE") EventSort sort,
      @RequestParam(defaultValue = "ASC") Sort.Direction direction,
      @AuthenticationPrincipal UserPrincipal principal) {
    Pageable pageable = PageRequests.of(page, size, sort, direction);
    Page<EventResponse> result = eventService.list(search, pageable, principal);
    return ApiResponse.page(
        "Events retrieved successfully.", result.getContent(), PageMeta.from(result));
  }

  @Operation(
      summary = "Create an event (Admin)",
      description =
          "Creates a new event in DRAFT status with an auto-generated unique slug. Accepts the UI"
              + " event fields: title, category, capacity (optional, null = unlimited), description,"
              + " venue, coverColor, coverImageUrl, and start/end times. ADMIN only. Errors: 400"
              + " VALIDATION_ERROR for invalid fields.")
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<EventResponse> create(
      @Valid @RequestBody EventCreateRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.ok("Event created successfully.", eventService.create(request, principal));
  }

  @Operation(
      summary = "Get an event",
      description =
          "Returns event details. Visible to ADMIN or any user assigned to the event (MANAGER /"
              + " HANDLER). Errors: 403 FORBIDDEN if not permitted, 404 NOT_FOUND if unknown.")
  @GetMapping("/{eventId}")
  public ApiResponse<EventResponse> get(@PathVariable UUID eventId) {
    return ApiResponse.ok("Event retrieved successfully.", eventService.get(eventId));
  }

  @Operation(
      summary = "Update an event",
      description =
          "Partial update of event details. Allowed for ADMIN or the event's MANAGER; null fields"
              + " are left unchanged. Errors: 403 FORBIDDEN, 404 NOT_FOUND.")
  @PutMapping("/{eventId}")
  public ApiResponse<EventResponse> update(
      @PathVariable UUID eventId, @Valid @RequestBody EventUpdateRequest request) {
    return ApiResponse.ok("Event updated successfully.", eventService.update(eventId, request));
  }

  @Operation(
      summary = "Upload an event cover image",
      description =
          "Uploads a cover image (PNG/JPEG/WebP, max 5 MB) for the event. The API brokers the bytes"
              + " to object storage and persists the key; the updated event (with a viewable"
              + " coverImageUrl) is returned. Allowed for ADMIN or the event's MANAGER. Errors: 400"
              + " VALIDATION_ERROR for an empty file or unsupported type/size; 403 FORBIDDEN; 404"
              + " NOT_FOUND.")
  @PostMapping(value = "/{eventId}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiResponse<EventResponse> uploadCover(
      @PathVariable UUID eventId, @RequestParam("file") MultipartFile file) {
    if (file.isEmpty()) {
      throw new ApiException(ErrorCode.VALIDATION_ERROR, "No file provided.");
    }
    byte[] bytes;
    try {
      bytes = file.getBytes();
    } catch (IOException e) {
      throw new ApiException(ErrorCode.VALIDATION_ERROR, "Could not read the uploaded file.");
    }
    return ApiResponse.ok(
        "Cover image uploaded successfully.",
        eventService.uploadCover(eventId, bytes, file.getContentType()));
  }

  @Operation(
      summary = "Publish an event (Admin)",
      description =
          "Transitions DRAFT → PUBLIC, making the event publicly registerable. ADMIN only. Errors:"
              + " 409 CONFLICT if the event is not in DRAFT.")
  @PostMapping("/{eventId}/publish")
  public ApiResponse<EventResponse> publish(@PathVariable UUID eventId) {
    return ApiResponse.ok("Event published.", eventService.publish(eventId));
  }

  @Operation(
      summary = "Archive an event (Admin)",
      description =
          "Transitions PUBLIC → ARCHIVED, closing further registration. ADMIN only. Errors: 409"
              + " CONFLICT if the event is not in PUBLIC.")
  @PostMapping("/{eventId}/archive")
  public ApiResponse<EventResponse> archive(@PathVariable UUID eventId) {
    return ApiResponse.ok("Event archived.", eventService.archive(eventId));
  }

  @Operation(
      summary = "Delete an event (Admin)",
      description =
          "Permanently deletes an event and its cascaded children (assignments, materials, form,"
              + " submissions, check-ins). ADMIN only — Sub-admins are forbidden. Errors: 404"
              + " NOT_FOUND if unknown.")
  @DeleteMapping("/{eventId}")
  public ApiResponse<Void> delete(@PathVariable UUID eventId) {
    eventService.delete(eventId);
    return ApiResponse.ok("Event deleted successfully.");
  }

  @Operation(
      summary = "Rotate the poster registration-QR token (Admin)",
      description =
          "Generates a new public registration-QR token for the event, invalidating any previously"
              + " printed posters/links. ADMIN only.")
  @PostMapping("/{eventId}/registration-qr/rotate")
  public ApiResponse<EventResponse> rotateRegistrationQr(@PathVariable UUID eventId) {
    return ApiResponse.ok(
        "Registration QR token rotated.", eventService.rotateRegistrationQr(eventId));
  }
}
