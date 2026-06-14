package com.gatherly.attendance.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Manual staff override (docs/03 §4.10): check a guest in by their submission id without a QR scan.
 * Manager-gated; recorded with {@code source = MANUAL}.
 */
public record ManualCheckinRequest(@NotNull UUID submissionId) {
}
