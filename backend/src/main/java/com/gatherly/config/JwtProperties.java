package com.gatherly.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * JWT signing/TTL config bound from {@code app.jwt.*} ({@code docs/03} §2.1: 15-min access, 7-day
 * refresh).
 *
 * @param secret HS256 signing secret (≥256 bits); env-injected, never committed
 * @param accessTokenTtlSeconds access-token lifetime (default 900 = 15 min)
 * @param refreshTokenTtlSeconds refresh-token lifetime (default 604800 = 7 days)
 */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
    String secret, long accessTokenTtlSeconds, long refreshTokenTtlSeconds) {}
