package com.gatherly.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

/**
 * Builds/clears the auth cookies ({@code docs/03} §1, §2.2). Access cookie is scoped to the API
 * root so it accompanies every call; the refresh cookie is path-scoped to {@code /auth} so it is
 * only sent to refresh/logout. Both are httpOnly + {@code SameSite=Strict}; {@code Secure} is on
 * outside local dev ({@code app.cookie.secure}).
 */
@Service
public class AuthCookieService {

  public static final String ACCESS_COOKIE = JwtAuthenticationFilter.ACCESS_COOKIE;
  public static final String REFRESH_COOKIE = "refresh_token";

  private static final String ACCESS_PATH = "/api/v1";
  private static final String REFRESH_PATH = "/api/v1/auth";

  private final boolean secure;

  public AuthCookieService(@Value("${app.cookie.secure:false}") boolean secure) {
    this.secure = secure;
  }

  public ResponseCookie access(String token, long maxAgeSeconds) {
    return build(ACCESS_COOKIE, token, ACCESS_PATH, maxAgeSeconds);
  }

  public ResponseCookie refresh(String token, long maxAgeSeconds) {
    return build(REFRESH_COOKIE, token, REFRESH_PATH, maxAgeSeconds);
  }

  public ResponseCookie clearAccess() {
    return build(ACCESS_COOKIE, "", ACCESS_PATH, 0);
  }

  public ResponseCookie clearRefresh() {
    return build(REFRESH_COOKIE, "", REFRESH_PATH, 0);
  }

  public String readRefresh(HttpServletRequest request) {
    if (request.getCookies() == null) {
      return null;
    }
    for (Cookie c : request.getCookies()) {
      if (REFRESH_COOKIE.equals(c.getName())) {
        return c.getValue();
      }
    }
    return null;
  }

  private ResponseCookie build(String name, String value, String path, long maxAgeSeconds) {
    return ResponseCookie.from(name, value)
        .httpOnly(true)
        .secure(secure)
        .sameSite("Strict")
        .path(path)
        .maxAge(maxAgeSeconds)
        .build();
  }
}
