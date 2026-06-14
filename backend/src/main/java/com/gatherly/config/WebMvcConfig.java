package com.gatherly.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerTypePredicate;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Applies the {@code /api/v1} base path to application controllers only (those in {@code
 * com.gatherly.controller}). This replaces the servlet {@code context-path} so that springdoc's
 * Swagger UI and API docs — which live outside that package — remain at the root ({@code
 * /swagger-ui/index.html}, {@code /v3/api-docs}), while every REST endpoint stays under {@code
 * /api/v1}.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

  @Override
  public void configurePathMatch(PathMatchConfigurer configurer) {
    configurer.addPathPrefix(
        "/api/v1", HandlerTypePredicate.forBasePackage("com.gatherly.controller"));
  }
}
