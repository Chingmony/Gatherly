package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.dto.agenda.AgendaItemRequest;
import com.gatherly.dto.agenda.AgendaItemResponse;
import com.gatherly.service.AgendaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Event agenda / run-of-show ({@code docs/03} §4.4). Listing follows event view rights; per-item
 * create/edit/delete require manage rights. Gates live on {@link AgendaService}. The spec's bulk
 * {@code PUT /events/{eventId}/agenda} (apply template / reorder) and {@code GET /agenda-templates}
 * remain deferred — the UI manages items individually.
 */
@Tag(
    name = "Agenda",
    description =
        "Per-event run-of-show. Listing follows event view rights (ADMIN or any user assigned to"
            + " the event).")
@RestController
public class AgendaController {

  private final AgendaService agendaService;

  public AgendaController(AgendaService agendaService) {
    this.agendaService = agendaService;
  }

  @Operation(
      summary = "List an event's agenda",
      description =
          "Returns the event's agenda items ordered by position. Visible to ADMIN or any user"
              + " assigned to the event. Errors: 403 FORBIDDEN.")
  @GetMapping("/events/{eventId}/agenda")
  public ApiResponse<List<AgendaItemResponse>> list(@PathVariable UUID eventId) {
    return ApiResponse.ok("Agenda retrieved successfully.", agendaService.list(eventId));
  }

  @Operation(
      summary = "Add an agenda item",
      description =
          "Appends a session to the event's run-of-show (at the end). Requires manage rights (ADMIN"
              + " or event MANAGER). Errors: 400 VALIDATION_ERROR if end is not after start; 403"
              + " FORBIDDEN; 404 NOT_FOUND if the event is unknown.")
  @PostMapping("/events/{eventId}/agenda")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<AgendaItemResponse> create(
      @PathVariable UUID eventId, @Valid @RequestBody AgendaItemRequest request) {
    return ApiResponse.ok("Agenda item added successfully.", agendaService.create(eventId, request));
  }

  @Operation(
      summary = "Update an agenda item",
      description =
          "Edits a session's title and timing. Requires manage rights (ADMIN or event MANAGER)."
              + " Errors: 400 VALIDATION_ERROR; 403 FORBIDDEN; 404 NOT_FOUND if the item is unknown"
              + " or not in this event.")
  @PutMapping("/events/{eventId}/agenda/{itemId}")
  public ApiResponse<AgendaItemResponse> update(
      @PathVariable UUID eventId,
      @PathVariable UUID itemId,
      @Valid @RequestBody AgendaItemRequest request) {
    return ApiResponse.ok(
        "Agenda item updated successfully.", agendaService.update(eventId, itemId, request));
  }

  @Operation(
      summary = "Delete an agenda item",
      description =
          "Removes a session from the event's run-of-show. Requires manage rights (ADMIN or event"
              + " MANAGER). Errors: 403 FORBIDDEN; 404 NOT_FOUND.")
  @DeleteMapping("/events/{eventId}/agenda/{itemId}")
  public ApiResponse<Void> delete(@PathVariable UUID eventId, @PathVariable UUID itemId) {
    agendaService.delete(eventId, itemId);
    return ApiResponse.ok("Agenda item deleted successfully.");
  }
}
