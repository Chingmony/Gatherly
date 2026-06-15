package com.gatherly.service;

import com.gatherly.dto.registration.PublicEventResponse;
import com.gatherly.dto.registration.PublicFormResponse;
import com.gatherly.dto.registration.RegistrationRequest;
import com.gatherly.dto.registration.RegistrationResponse;
import com.gatherly.dto.registration.TicketResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Public guest surface ({@code docs/03} §4.9, {@code docs/06} §6). Unauthenticated — gated by the
 * {@code permitAll} on {@code /public/**}; access is validated by event/form state, never by role.
 */
public interface RegistrationService {

  /** Browse PUBLIC events for guest discovery, with optional name/category/location filters. */
  Page<PublicEventResponse> listPublicEvents(
      String search, String category, String location, Pageable pageable);

  /** Public details of a single PUBLIC event by slug (404 if unknown or not public). */
  PublicEventResponse getPublicEvent(String slug);

  PublicFormResponse getPublicForm(String slug);

  PublicFormResponse resolvePoster(String registrationQrToken);

  RegistrationResponse register(UUID eventId, RegistrationRequest request);

  TicketResponse getTicket(String checkinToken);

  RegistrationResponse resend(String checkinToken);
}
