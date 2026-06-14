package com.gatherly.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Springdoc OpenAPI metadata. Swagger UI served at {@code /api/v1/swagger-ui.html}. */
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
