package com.gatherly.ping;

import java.time.Instant;

/** Liveness payload for the M0 walking-skeleton end-to-end check (docs/13 §M0). */
public record PingResponse(String status, String service, Instant timestamp) {
}
