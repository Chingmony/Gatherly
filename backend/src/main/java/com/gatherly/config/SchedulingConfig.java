package com.gatherly.config;

import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.provider.redis.spring.RedisLockProvider;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Enables {@code @Scheduled} jobs (docs/06 §7) — the QR-email retry sweep and the Telegram ops
 * retry sweep — and (M9) gates them with ShedLock so only ONE instance fires each tick across a
 * multi-instance deployment (docs/08). The Redis-backed {@link LockProvider} reuses the same Redis
 * already used for OTP/rate-limit. Jobs remain idempotent, so the lock is defence-in-depth.
 */
@Configuration
@EnableScheduling
@EnableSchedulerLock(defaultLockAtMostFor = "PT5M")
public class SchedulingConfig {

    @Bean
    LockProvider lockProvider(RedisConnectionFactory connectionFactory) {
        return new RedisLockProvider(connectionFactory, "gatherly");
    }
}
