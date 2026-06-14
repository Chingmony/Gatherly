package com.gatherly.publicsite;

import com.gatherly.form.FormService;
import com.gatherly.form.dto.PublicFormResponse;
import com.gatherly.registration.RegistrationService;
import com.gatherly.registration.dto.PublicEventCard;
import com.gatherly.registration.dto.PublicTicketResponse;
import com.gatherly.registration.dto.RegisterRequest;
import com.gatherly.registration.dto.RegisterResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Public guest surface (docs/03 §4.9) — the only unauthenticated domain routes besides {@code
 * /auth/**}. Layer-1 {@code permitAll} covers {@code /api/v1/public/**} (SecurityConfig). Guests
 * browse PUBLIC events, fetch an active form, register, and view their ticket; everything else
 * stays gated. Registration validates answers server-side and never creates an attendance record.
 */
@RestController
@RequestMapping("/api/v1/public")
public class PublicController {

    private final FormService formService;
    private final RegistrationService registrationService;

    public PublicController(FormService formService, RegistrationService registrationService) {
        this.formService = formService;
        this.registrationService = registrationService;
    }

    @GetMapping("/events")
    public List<PublicEventCard> events() {
        return registrationService.listPublicEvents();
    }

    @GetMapping("/events/{slug}/form")
    public PublicFormResponse form(@PathVariable String slug) {
        return formService.publicActiveForm(slug);
    }

    @PostMapping("/events/{eventId}/register")
    public ResponseEntity<RegisterResponse> register(@PathVariable UUID eventId,
                                                     @Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(registrationService.register(eventId, req));
    }

    @GetMapping("/tickets/{checkinToken}")
    public PublicTicketResponse ticket(@PathVariable String checkinToken) {
        return registrationService.ticket(checkinToken);
    }
}
