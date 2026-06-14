package com.gatherly.security;

import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.error.ErrorResponse;
import com.gatherly.config.RateLimitProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

/**
 * Per-IP rate limiting on abuse-prone public endpoints ({@code docs/03} §7): login, OTP
 * request/verify, public registration, and ticket resend. Runs before Spring Security (highest
 * precedence) and returns a uniform {@code 429 RATE_LIMITED} envelope when a window is exceeded.
 * No-ops when disabled.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RateLimitingFilter extends OncePerRequestFilter {

  private static final int WINDOW_SECONDS = 60;
  private final AntPathMatcher matcher = new AntPathMatcher();

  private final RateLimiter rateLimiter;
  private final RateLimitProperties props;
  private final ObjectMapper objectMapper;

  public RateLimitingFilter(
      RateLimiter rateLimiter, RateLimitProperties props, ObjectMapper objectMapper) {
    this.rateLimiter = rateLimiter;
    this.props = props;
    this.objectMapper = objectMapper;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    Bucket bucket = props.enabled() ? bucketFor(request) : null;
    if (bucket != null
        && !rateLimiter.tryConsume(bucket.name, clientIp(request), bucket.limit, WINDOW_SECONDS)) {
      writeTooManyRequests(request, response);
      return;
    }
    filterChain.doFilter(request, response);
  }

  private Bucket bucketFor(HttpServletRequest request) {
    if (!HttpMethod.POST.matches(request.getMethod())) {
      return null;
    }
    String uri = request.getRequestURI();
    if (matcher.match("/api/v1/auth/login", uri)) {
      return new Bucket("login", props.loginPerMinute());
    }
    if (matcher.match("/api/v1/auth/forgot-password", uri)
        || matcher.match("/api/v1/auth/verify-otp", uri)) {
      return new Bucket("otp", props.otpPerMinute());
    }
    if (matcher.match("/api/v1/public/events/*/register", uri)
        || matcher.match("/api/v1/public/tickets/*/resend", uri)) {
      return new Bucket("register", props.registerPerMinute());
    }
    return null;
  }

  private void writeTooManyRequests(HttpServletRequest request, HttpServletResponse response)
      throws IOException {
    ErrorResponse body =
        ErrorResponse.of(
            ErrorCode.RATE_LIMITED,
            "Too many requests. Please try again shortly.",
            request.getRequestURI(),
            null,
            null);
    response.setStatus(ErrorCode.RATE_LIMITED.status().value());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    objectMapper.writeValue(response.getWriter(), body);
  }

  private static String clientIp(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    if (StringUtils.hasText(forwarded)) {
      return forwarded.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }

  private record Bucket(String name, int limit) {}
}
