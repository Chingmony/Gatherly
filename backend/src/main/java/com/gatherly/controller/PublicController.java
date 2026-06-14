package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.dto.registration.PublicFormResponse;
import com.gatherly.dto.registration.RegistrationRequest;
import com.gatherly.dto.registration.RegistrationResponse;
import com.gatherly.dto.registration.TicketResponse;
import com.gatherly.service.RegistrationService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public guest surface ({@code docs/03} §4.9) — unauthenticated ({@code permitAll} on {@code
 * /public/**}). Guests register only here; attendance is confirmed by an organizer scan (M7).
 */
@RestController
@RequestMapping("/public")
public class PublicController {

  private final RegistrationService registrationService;

  public PublicController(RegistrationService registrationService) {
    this.registrationService = registrationService;
  }

  @GetMapping("/r/resolve")
  public ApiResponse<PublicFormResponse> resolvePoster(@RequestParam("token") String token) {
    return ApiResponse.ok("Event resolved.", registrationService.resolvePoster(token));
  }

  @GetMapping("/events/{slug}/form")
  public ApiResponse<PublicFormResponse> form(@PathVariable String slug) {
    return ApiResponse.ok("Form retrieved successfully.", registrationService.getPublicForm(slug));
  }

  @PostMapping("/events/{eventId}/register")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<RegistrationResponse> register(
      @PathVariable UUID eventId, @Valid @RequestBody RegistrationRequest request) {
    return ApiResponse.ok("Registration received.", registrationService.register(eventId, request));
  }

  @GetMapping("/tickets/{checkinToken}")
  public ApiResponse<TicketResponse> ticket(@PathVariable String checkinToken) {
    return ApiResponse.ok(
        "Ticket retrieved successfully.", registrationService.getTicket(checkinToken));
  }

  @PostMapping("/tickets/{checkinToken}/resend")
  public ApiResponse<RegistrationResponse> resend(@PathVariable String checkinToken) {
    return ApiResponse.ok("Ticket re-sent.", registrationService.resend(checkinToken));
  }
}
