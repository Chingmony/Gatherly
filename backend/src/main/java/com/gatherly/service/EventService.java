package com.gatherly.service;

import com.gatherly.dto.event.EventCreateRequest;
import com.gatherly.dto.event.EventResponse;
import com.gatherly.dto.event.EventUpdateRequest;
import com.gatherly.dto.event.PublicEventResponse;
import com.gatherly.security.UserPrincipal;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** Event CRUD + lifecycle ({@code docs/03} §4.4, {@code docs/06} §3). */
public interface EventService {

  /** Service-scoped list: Admin sees all; others only assigned events (wired in M3). */
  Page<EventResponse> list(String query, Pageable pageable, UserPrincipal principal);

  /**
   * Unauthenticated public discovery list: only PUBLIC events, with optional title search and
   * start-time range ({@code from}/{@code to}).
   */
  Page<PublicEventResponse> listPublic(String query, Instant from, Instant to, Pageable pageable);

  EventResponse create(EventCreateRequest request, UserPrincipal principal);

  EventResponse get(UUID eventId);

  EventResponse update(UUID eventId, EventUpdateRequest request);

  /**
   * Stores an uploaded cover image for the event and persists its object key. Allowed for ADMIN or
   * the event's MANAGER (same gate as {@link #update}). The returned response carries a viewable
   * (presigned) cover URL.
   */
  EventResponse uploadCover(UUID eventId, byte[] content, String contentType);

  /** DRAFT → PUBLIC (Admin). */
  EventResponse publish(UUID eventId);

  /** PUBLIC → ARCHIVED (Admin). */
  EventResponse archive(UUID eventId);

  void delete(UUID eventId);

  /** Rotate the optional poster registration-QR token (Admin), invalidating printed posters. */
  EventResponse rotateRegistrationQr(UUID eventId);
}
