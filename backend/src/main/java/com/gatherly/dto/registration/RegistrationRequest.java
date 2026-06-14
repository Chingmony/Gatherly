package com.gatherly.dto.registration;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

/**
 * Public guest registration ({@code POST /public/events/{eventId}/register}). {@code answers} is
 * keyed by field key; validated server-side against the active form schema ({@code docs/07} §3).
 */
public record RegistrationRequest(@NotNull Map<String, Object> answers) {}
