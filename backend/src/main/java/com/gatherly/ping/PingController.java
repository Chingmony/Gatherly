package com.gatherly.ping;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

/**
 * Public liveness endpoint that the frontend calls to prove the end-to-end path
 * (browser → Next.js → Spring) for the M0 walking skeleton (docs/13 §M0). Unauthenticated by
 * design; it carries no domain data. Real health/readiness probes are {@code /actuator/health}.
 */
@RestController
@RequestMapping("/api/v1/ping")
public class PingController {

    @GetMapping
    public PingResponse ping() {
        return new PingResponse("ok", "gatherly-backend", Instant.now());
    }
}
