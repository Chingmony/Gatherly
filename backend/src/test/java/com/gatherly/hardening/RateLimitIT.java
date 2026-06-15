package com.gatherly.hardening;

import com.gatherly.AbstractIntegrationTest;
import com.gatherly.support.HttpTestClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.TestPropertySource;

import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Per-IP rate limiting (docs/10 §6, threats T10/T11). Dials the login bucket down to 3/min for this
 * class; the 4th attempt within the window must be {@code 429 RATE_LIMITED} regardless of credential
 * validity (the throttle precedes auth).
 */
@TestPropertySource(properties = "gatherly.rate-limit.login=3")
class RateLimitIT extends AbstractIntegrationTest {

    @LocalServerPort
    int port;
    @Autowired
    StringRedisTemplate redis;

    @BeforeEach
    void resetCounter() {
        // Singleton Redis is shared across the JVM run — start from a clean login counter for our IP.
        redis.delete("rl:login:127.0.0.1");
    }

    @Test
    void loginIsRateLimitedPerIp() {
        HttpTestClient c = new HttpTestClient(port);
        String body = "{\"email\":\"nobody@gatherly.test\",\"password\":\"whatever1\"}";

        for (int i = 0; i < 3; i++) {
            assertThat(c.post("/api/v1/auth/login", body).statusCode())
                    .as("attempt %d under the limit", i + 1).isEqualTo(401);
        }
        HttpResponse<String> limited = c.post("/api/v1/auth/login", body);
        assertThat(limited.statusCode()).isEqualTo(429);
        assertThat(limited.body()).contains("RATE_LIMITED");
        assertThat(limited.headers().firstValue("Retry-After")).isPresent();
    }
}
