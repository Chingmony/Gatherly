package com.gatherly.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Springdoc OpenAPI metadata. With context-path {@code /api/v1}, Swagger UI is served at {@code
 * http://localhost:8080/api/v1/swagger-ui.html} and the spec at {@code /api/v1/v3/api-docs}.
 */
@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI gatherlyOpenApi() {
    return new OpenAPI()
        .info(
            new Info()
                .title("Gatherly API")
                .version("v1")
                .description("Single-organization event management platform — see /docs."));
  }
}
