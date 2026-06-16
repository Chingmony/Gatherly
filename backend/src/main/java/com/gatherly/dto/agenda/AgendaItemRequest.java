package com.gatherly.dto.agenda;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/**
 * Create/update an agenda slot (Manager/Admin). {@code position} is managed server-side (new items
 * append to the end), so it is not part of the request. {@code startsAt}/{@code endsAt} are optional
 * but, when both are present, {@code endsAt} must be after {@code startsAt} (checked in the service).
 */
public record AgendaItemRequest(
    @NotBlank @Size(max = 200) String title, Instant startsAt, Instant endsAt) {}
