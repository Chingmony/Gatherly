package com.gatherly.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Resolves the access token from the {@code Authorization: Bearer} header (API clients / Swagger)
 * or the {@code access_token} httpOnly cookie (the web app), validates it via {@link JwtService},
 * and populates the {@code SecurityContext} with a {@link UserPrincipal} and {@code ROLE_<role>}
 * authority ({@code docs/03} §2.2). Stateless: no session is created. Invalid/missing tokens simply
 * leave the context empty — downstream {@code authenticated()} / method gates produce 401/403.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  public static final String ACCESS_COOKIE = "access_token";
  private static final String BEARER_PREFIX = "Bearer ";

  private final JwtService jwtService;

  public JwtAuthenticationFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    if (SecurityContextHolder.getContext().getAuthentication() == null) {
      resolveToken(request)
          .flatMap(jwtService::parse)
          .ifPresent(
              principal -> {
                var auth =
                    UsernamePasswordAuthenticationToken.authenticated(
                        principal, null, principal.authorities());
                SecurityContextHolder.getContext().setAuthentication(auth);
              });
    }
    filterChain.doFilter(request, response);
  }

  /** Bearer header takes precedence over the cookie. */
  private static Optional<String> resolveToken(HttpServletRequest request) {
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (StringUtils.hasText(header) && header.startsWith(BEARER_PREFIX)) {
      String token = header.substring(BEARER_PREFIX.length()).trim();
      if (StringUtils.hasText(token)) {
        return Optional.of(token);
      }
    }
    return readCookie(request, ACCESS_COOKIE);
  }

  private static Optional<String> readCookie(HttpServletRequest request, String name) {
    if (request.getCookies() == null) {
      return Optional.empty();
    }
    for (Cookie c : request.getCookies()) {
      if (name.equals(c.getName()) && c.getValue() != null && !c.getValue().isBlank()) {
        return Optional.of(c.getValue());
      }
    }
    return Optional.empty();
  }
}
