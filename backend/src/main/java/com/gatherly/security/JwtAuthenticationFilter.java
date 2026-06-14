package com.gatherly.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Reads the access-token cookie, validates it via {@link JwtService}, and populates the {@code
 * SecurityContext} with a {@link UserPrincipal} and {@code ROLE_<role>} authority ({@code docs/03}
 * §2.2). Stateless: no session is created. Invalid/missing tokens simply leave the context empty —
 * downstream {@code authenticated()} / method gates produce 401/403.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  public static final String ACCESS_COOKIE = "access_token";

  private final JwtService jwtService;

  public JwtAuthenticationFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    if (SecurityContextHolder.getContext().getAuthentication() == null) {
      readCookie(request, ACCESS_COOKIE)
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

  private static java.util.Optional<String> readCookie(HttpServletRequest request, String name) {
    if (request.getCookies() == null) {
      return java.util.Optional.empty();
    }
    for (Cookie c : request.getCookies()) {
      if (name.equals(c.getName()) && c.getValue() != null && !c.getValue().isBlank()) {
        return java.util.Optional.of(c.getValue());
      }
    }
    return java.util.Optional.empty();
  }
}
