package com.gatherly.form;

import com.gatherly.form.dto.FormResponse;
import com.gatherly.form.dto.UpdateFormRequest;
import com.gatherly.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Registration-form endpoints (docs/03 §4.8). Thin controller; event-scoped gates + the
 * email/phone activation guard live on {@link FormService}.
 */
@RestController
@RequestMapping("/api/v1/events/{eventId}/form")
public class FormController {

    private final FormService formService;

    public FormController(FormService formService) {
        this.formService = formService;
    }

    @GetMapping
    public FormResponse get(@PathVariable UUID eventId) {
        return formService.getForm(eventId);
    }

    @PutMapping
    public FormResponse save(@PathVariable UUID eventId, @Valid @RequestBody UpdateFormRequest req,
                             @AuthenticationPrincipal UserPrincipal principal) {
        return formService.saveForm(eventId, req, principal);
    }

    @PostMapping("/activate")
    public FormResponse activate(@PathVariable UUID eventId) {
        return formService.activate(eventId);
    }
}
