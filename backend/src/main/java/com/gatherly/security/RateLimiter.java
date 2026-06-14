package com.gatherly.security;

import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Fixed-window per-key rate limiter backed by Redis ({@code docs/04} §3.3). The first hit in a
 * window sets the TTL; subsequent hits {@code INCR}. <strong>Fails open</strong> — if Redis is
 * unreachable the request is allowed (rate limiting is abuse mitigation, not a core gate).
 */
@Component
public class RateLimiter {

  private static final Logger log = LoggerFactory.getLogger(RateLimiter.class);

  private final StringRedisTemplate redis;

  public RateLimiter(StringRedisTemplate redis) {
    this.redis = redis;
  }

  /**
   * @return true if the request is within the limit (or Redis is down).
   */
  public boolean tryConsume(String bucket, String ip, int limit, int windowSeconds) {
    String key = "rl:" + bucket + ":" + ip;
    try {
      Long count = redis.opsForValue().increment(key);
      if (count != null && count == 1L) {
        redis.expire(key, Duration.ofSeconds(windowSeconds));
      }
      return count == null || count <= limit;
    } catch (RuntimeException ex) {
      log.warn("Rate limiter unavailable; failing open for {}: {}", key, ex.getMessage());
      return true;
    }
  }
}
