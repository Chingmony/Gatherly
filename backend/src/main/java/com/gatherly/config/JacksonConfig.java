package com.gatherly.config;

import org.springframework.context.annotation.Configuration;

/**
 * JSON conventions (docs/06 §9). Jackson 3 (Spring Boot 4) serializes dates as ISO-8601 by
 * default, so no explicit configuration is required at M0.
 *
 * <p>This class is the home for the dynamic-form JSONB ({@code JsonNode}) mapping customizer
 * added with the form feature in M5; it intentionally declares no beans at M0.
 */
@Configuration
public class JacksonConfig {
}
