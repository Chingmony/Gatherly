package com.gatherly.dto.attendance;

import jakarta.validation.constraints.NotBlank;

/** Organizer QR scan ({@code POST /events/{eventId}/attendance/scan}). */
public record ScanRequest(@NotBlank String checkinToken) {}
