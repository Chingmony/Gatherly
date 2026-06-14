package com.gatherly.registration;

import com.gatherly.common.PageResponse;
import com.gatherly.registration.dto.SubmissionResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Organizer "Manage Guests" (docs/03 §4.8). Thin controller; the {@code canView} gate lives on
 * {@link RegistrationService#listSubmissions}.
 */
@RestController
@RequestMapping("/api/v1/events/{eventId}/submissions")
public class SubmissionController {

    private final RegistrationService registrationService;

    public SubmissionController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @GetMapping
    public PageResponse<SubmissionResponse> list(@PathVariable UUID eventId,
                                                 @PageableDefault(size = 50) Pageable pageable) {
        return PageResponse.of(registrationService.listSubmissions(eventId, pageable), s -> s);
    }
}
