package com.gatherly.dto.attendance;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/** Staff manual override without a QR ({@code POST /events/{eventId}/attendance/manual}). */
public record ManualCheckinRequest(@NotNull UUID submissionId) {}
