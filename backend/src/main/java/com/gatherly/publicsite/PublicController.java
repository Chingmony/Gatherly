package com.gatherly.publicsite;

import com.gatherly.form.FormService;
import com.gatherly.form.dto.PublicFormResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public guest surface (docs/03 §4.9) — the only unauthenticated domain routes besides {@code
 * /auth/**}. Layer-1 {@code permitAll} covers {@code /api/v1/public/**} (SecurityConfig). The guest
 * can browse public events and fetch an active form to register; everything else stays gated.
 * Event listing + registration are added in P4.
 */
@RestController
@RequestMapping("/api/v1/public")
public class PublicController {

    private final FormService formService;

    public PublicController(FormService formService) {
        this.formService = formService;
    }

    @GetMapping("/events/{slug}/form")
    public PublicFormResponse form(@PathVariable String slug) {
        return formService.publicActiveForm(slug);
    }
}
