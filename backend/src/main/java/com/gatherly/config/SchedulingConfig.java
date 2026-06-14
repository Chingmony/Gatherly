package com.gatherly.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Enables {@code @Scheduled} jobs (docs/06 §7) — the QR-email retry sweep and the Telegram ops
 * retry sweep. Multi-instance
 * de-duplication (ShedLock / {@code FOR UPDATE SKIP LOCKED}) is deferred to M9 hardening; the jobs
 * are written idempotently so a double-run is safe in the meantime.
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
