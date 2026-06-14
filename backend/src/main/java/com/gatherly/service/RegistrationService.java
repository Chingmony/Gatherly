package com.gatherly.service;

import com.gatherly.dto.registration.PublicFormResponse;
import com.gatherly.dto.registration.RegistrationRequest;
import com.gatherly.dto.registration.RegistrationResponse;
import com.gatherly.dto.registration.TicketResponse;
import java.util.UUID;

/**
 * Public guest surface ({@code docs/03} §4.9, {@code docs/06} §6). Unauthenticated — gated by the
 * {@code permitAll} on {@code /public/**}; access is validated by event/form state, never by role.
 */
public interface RegistrationService {

  PublicFormResponse getPublicForm(String slug);

  PublicFormResponse resolvePoster(String registrationQrToken);

  RegistrationResponse register(UUID eventId, RegistrationRequest request);

  TicketResponse getTicket(String checkinToken);

  RegistrationResponse resend(String checkinToken);
}
