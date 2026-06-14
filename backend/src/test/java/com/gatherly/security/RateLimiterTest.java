package com.gatherly.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

/** Unit tests for the Redis fixed-window rate limiter, including fail-open. */
@ExtendWith(MockitoExtension.class)
class RateLimiterTest {

  @Mock private StringRedisTemplate redis;
  @Mock private ValueOperations<String, String> valueOps;

  private RateLimiter rateLimiter;

  @BeforeEach
  void setUp() {
    rateLimiter = new RateLimiter(redis);
    lenient().when(redis.opsForValue()).thenReturn(valueOps);
  }

  @Test
  void allowsRequestsWithinLimit() {
    when(valueOps.increment(anyString())).thenReturn(1L);
    assertThat(rateLimiter.tryConsume("login", "1.2.3.4", 10, 60)).isTrue();
  }

  @Test
  void blocksRequestsOverLimit() {
    when(valueOps.increment(anyString())).thenReturn(11L);
    assertThat(rateLimiter.tryConsume("login", "1.2.3.4", 10, 60)).isFalse();
  }

  @Test
  void failsOpenWhenRedisUnavailable() {
    when(redis.opsForValue()).thenReturn(valueOps);
    when(valueOps.increment(any())).thenThrow(new RuntimeException("connection refused"));
    assertThat(rateLimiter.tryConsume("login", "1.2.3.4", 10, 60)).isTrue();
  }
}
