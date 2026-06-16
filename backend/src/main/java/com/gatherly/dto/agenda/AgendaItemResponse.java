package com.gatherly.dto.agenda;

import java.time.Instant;
import java.util.UUID;

/**
 * Agenda slot projection — mirrors the {@code agenda_item} table ({@code docs/02} §3.8). Fields not
 * backed by the schema (location, session type, staff) are deliberately omitted; the frontend
 * derives display-only enrichment on its side.
 */
public record AgendaItemResponse(
    UUID id,
    UUID eventId,
    String title,
    Instant startsAt,
    Instant endsAt,
    Integer position,
    Instant createdAt,
    Instant updatedAt) {}
