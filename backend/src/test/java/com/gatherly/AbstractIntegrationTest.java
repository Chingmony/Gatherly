package com.gatherly;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Base for integration tests: boots the full Spring context against real PostgreSQL + Redis via
 * Testcontainers (never H2 — docs/09 §2.2), so real Flyway migrations, JSONB/GIN/CHECK
 * constraints, and the Redis-backed OTP lifecycle are all exercised.
 *
 * <p>Uses the <b>singleton-container</b> pattern: the containers are started once in a static
 * initializer and kept up for the whole JVM (reaped by Ryuk at exit). This is required because
 * Spring caches the application context across test classes — {@code @Testcontainers}/{@code @Container}
 * would stop the containers after the first class, leaving the cached context pointing at dead ones.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16");
    static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7").withExposedPorts(6379);

    static {
        POSTGRES.start();
        REDIS.start();
    }

    @DynamicPropertySource
    static void backingServiceProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
    }
}
