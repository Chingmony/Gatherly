package com.gatherly.privacy;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Admin data-subject erasure (docs/10 §7). Thin controller — the Admin-only gate lives on
 * {@link PrivacyService#erase}.
 */
@RestController
@RequestMapping("/api/v1/admin")
public class PrivacyController {

    private final PrivacyService privacyService;

    public PrivacyController(PrivacyService privacyService) {
        this.privacyService = privacyService;
    }

    /** Erase a guest's submissions by email and/or phone. Returns the number of records removed. */
    @DeleteMapping("/guest-data")
    public Map<String, Integer> erase(@RequestParam(required = false) String email,
                                      @RequestParam(required = false) String phone) {
        return Map.of("erased", privacyService.erase(email, phone));
    }
}
