package com.gatherly.service;

import com.gatherly.dto.agenda.AgendaItemRequest;
import com.gatherly.dto.agenda.AgendaItemResponse;
import java.util.List;
import java.util.UUID;

/**
 * Event run-of-show ({@code docs/03} §4.4). Listing follows event view rights; create/edit/delete
 * require manage rights (ADMIN or event MANAGER). New items append to the end of the order.
 */
public interface AgendaService {

  /** An event's agenda items in display order. Requires view rights on the event. */
  List<AgendaItemResponse> list(UUID eventId);

  /** Append a new agenda item to the event. Requires manage rights. */
  AgendaItemResponse create(UUID eventId, AgendaItemRequest request);

  /** Edit an agenda item's title/timing. Requires manage rights. */
  AgendaItemResponse update(UUID eventId, UUID itemId, AgendaItemRequest request);

  /** Remove an agenda item from the event. Requires manage rights. */
  void delete(UUID eventId, UUID itemId);
}
