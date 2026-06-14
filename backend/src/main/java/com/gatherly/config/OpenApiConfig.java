package com.gatherly.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Springdoc OpenAPI metadata + JWT bearer auth. With the {@code /api/v1} controller prefix, Swagger
 * UI is served at {@code http://localhost:8080/swagger-ui/index.html} and the spec at {@code
 * /v3/api-docs}.
 *
 * <p>The {@code bearerAuth} scheme makes the Swagger <em>Authorize</em> button send {@code
 * Authorization: Bearer <jwt>}; the access JWT is returned by {@code POST /auth/login} (and also
 * set as an httpOnly cookie for the web app). Public endpoints ({@code /auth/**}, {@code
 * /public/**}) still work without it.
 */
@Configuration
public class OpenApiConfig {

  private static final String BEARER_SCHEME = "bearerAuth";

  @Bean
  public OpenAPI gatherlyOpenApi() {
    return new OpenAPI()
        .info(
            new Info()
                .title("Gatherly API")
                .version("v1")
                .description("Single-organization event management platform — see /docs."))
        .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
        .components(
            new Components()
                .addSecuritySchemes(
                    BEARER_SCHEME,
                    new SecurityScheme()
                        .name(BEARER_SCHEME)
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("Paste the accessToken from POST /auth/login.")));
  }
}
