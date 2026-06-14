package com.gatherly.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI metadata. The generated spec is the source for the frontend's typed client
 * ({@code lib/api/types.gen.ts}, docs/05 §3) — keeping FE/BE drift a compile-time error.
 * Swagger UI is served at {@code /swagger-ui.html}.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI gatherlyOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("Gatherly API")
                .version("v1")
                .description("Event Management Platform — REST contract (docs/03)."));
    }
}
