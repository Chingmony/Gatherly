package com.gatherly.config;

import com.gatherly.common.error.ApiError;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.observability.RequestTracingFilter;
import com.gatherly.security.JwtAuthenticationFilter;
import tools.jackson.databind.json.JsonMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Stateless security baseline (docs/03 §2.2): the JWT cookie filter authenticates each request,
 * {@code @EnableMethodSecurity} runs the {@code @PreAuthorize} gates, and filter-level 401/403 are
 * rendered in the uniform error contract (docs/07).
 *
 * <p>{@code permitAll} (post-M9 lockdown): {@code /actuator/health}, {@code /api/v1/ping},
 * {@code /api/v1/public/**}, {@code /api/v1/auth/**}. Everything else requires authentication
 * (layer 1), then a method-level gate (layer 2, docs/03 §3) — including {@code /actuator/info},
 * {@code /actuator/prometheus}, and the OpenAPI/Swagger UI, which are no longer public (docs/03 §2.2).
 * Secure response headers (HSTS/CSP/frame-options/referrer) are applied per docs/10 §6.
 */
@Configuration
@EnableMethodSecurity
@EnableConfigurationProperties(AuthProperties.class)
public class SecurityConfig {

    private final JsonMapper jsonMapper;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${gatherly.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    public SecurityConfig(JsonMapper jsonMapper, JwtAuthenticationFilter jwtAuthenticationFilter) {
        // Spring Boot 4 auto-configures a Jackson 3 JsonMapper (the Jackson 2 ObjectMapper is
        // no longer a bean). Used to render filter-level auth failures in the uniform contract.
        this.jsonMapper = jsonMapper;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // cookie auth is SameSite=Strict (docs/03 §7, docs/10 §5)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Secure response headers (docs/10 §6): HSTS, deny framing, nosniff, referrer policy,
                // and a locked-down CSP (this API serves JSON; no inline content needed).
                .headers(headers -> headers
                        .frameOptions(fo -> fo.deny())
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true).maxAgeInSeconds(31536000))
                        .referrerPolicy(rp -> rp.policy(
                                ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'none'; frame-ancestors 'none'; base-uri 'none'")))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .authorizeHttpRequests(auth -> auth
                        // Liveness/readiness stay public + shallow (docs/08 §6).
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers("/api/v1/ping").permitAll()
                        .requestMatchers("/api/v1/public/**", "/api/v1/auth/**").permitAll()
                        // M9 lockdown (docs/03 §2.2, docs/08 §6): /actuator/info, /actuator/prometheus
                        // and the OpenAPI/Swagger UI now require authentication (no longer permitAll).
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) ->
                                writeError(response, ErrorCode.UNAUTHENTICATED,
                                        "Authentication is required.", request.getRequestURI()))
                        .accessDeniedHandler((request, response, deniedException) ->
                                writeError(response, ErrorCode.FORBIDDEN,
                                        "You do not have permission to perform this action.",
                                        request.getRequestURI())))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                // Correlation id + structured access log, after auth so userId is resolvable (docs/08 §2).
                .addFilterAfter(new RequestTracingFilter(), JwtAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(allowedOrigins.split(",")).map(String::trim).toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // Explicit allowlist (docs/10 §6) — narrower than the prior "*".
        config.setAllowedHeaders(List.of("Content-Type", "Accept", "X-Requested-With"));
        config.setAllowCredentials(true); // cookie-based JWT transport (docs/03 §1)
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /** Renders a filter-level auth failure in the same {@link ApiError} shape as the advice. */
    private void writeError(HttpServletResponse response, ErrorCode code, String message, String path)
            throws IOException {
        String traceId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        ApiError error = ApiError.of(code, message, path, traceId);
        response.setStatus(code.status().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        jsonMapper.writeValue(response.getWriter(), error);
    }
}
