package com.gatherly.dto.registration;

import java.time.Instant;
import java.util.UUID;

/**
 * Guest-safe projection of a PUBLIC event for the public discovery surface (the frontend
 * {@code /explore} browse cards and the {@code /events/{slug}/register} hero). Deliberately omits
 * internal fields (creator, poster QR token, lifecycle status) — only PUBLIC events are ever
 * exposed here. {@code registeredCount} is the live submission count powering the "N registered" /
 * fill-rate UI.
 */
public record PublicEventResponse(
    UUID id,
    String slug,
    String title,
    String category,
    String description,
    String venue,
    String coverColor,
    String coverImageUrl,
    Instant startsAt,
    Instant endsAt,
    Integer capacity,
    long registeredCount) {}
