plugins {
    java
    id("org.springframework.boot") version "4.0.0"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.gatherly"
version = "0.0.1-SNAPSHOT"
description = "Gatherly — Event Management Platform (backend)"

java {
    // Spec-locked toolchain (docs/00 §6, docs/12 §1). Gradle auto-provisions JDK 21
    // on first build if it is not already installed locally.
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // --- Web / validation / JSON ---
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // --- Persistence (PostgreSQL + JPA + Flyway) ---
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    // Spring Boot 4 split Flyway autoconfiguration into its own module; without it,
    // flyway-core is present but migrations never run automatically.
    implementation("org.springframework.boot:spring-boot-flyway")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")

    // --- Security (filter chain + method security) + JWT (HS256 via jjwt) ---
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")

    // --- Redis (OTP + rate-limit counters) ---
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    // --- Email (OTP + QR-ticket delivery; JavaMailSender → MailHog locally) ---
    implementation("org.springframework.boot:spring-boot-starter-mail")

    // --- Observability (health endpoints + Prometheus scrape, docs/08) ---
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("io.micrometer:micrometer-registry-prometheus")

    // --- API docs (OpenAPI → generated FE types, docs/05 §3) ---
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.0")

    // --- Test (Testcontainers per docs/09 — real Postgres/Redis, never H2) ---
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    // Testcontainers 2.x (managed by the Spring Boot 4 BOM) renamed the module artifacts
    // to the `testcontainers-<module>` form.
    testImplementation("org.testcontainers:testcontainers-junit-jupiter")
    testImplementation("org.testcontainers:testcontainers-postgresql")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
