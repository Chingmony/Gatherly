package com.gatherly.security;

import com.gatherly.config.AuthProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

/**
 * Reads/writes the auth transport cookies (docs/03 §1): the access JWT in an httpOnly,
 * {@code SameSite=Strict} cookie scoped to {@code /}, and the opaque refresh token scoped to
 * the auth path so it is only sent to {@code /api/v1/auth/**}. {@code Secure} is configurable
 * ({@code false} for local http dev only).
 */
@Component
public class AuthCookies {

    public static final String ACCESS_COOKIE = "access_token";
    public static final String REFRESH_COOKIE = "refresh_token";
    public static final String REFRESH_PATH = "/api/v1/auth";

    private final AuthProperties props;

    public AuthCookies(AuthProperties props) {
        this.props = props;
    }

    public void write(HttpServletResponse response, String accessToken, String refreshToken) {
        response.addHeader(HttpHeaders.SET_COOKIE,
                build(ACCESS_COOKIE, accessToken, "/", props.jwt().accessTtl()).toString());
        response.addHeader(HttpHeaders.SET_COOKIE,
                build(REFRESH_COOKIE, refreshToken, REFRESH_PATH, props.jwt().refreshTtl()).toString());
    }

    public void clear(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, build(ACCESS_COOKIE, "", "/", Duration.ZERO).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, build(REFRESH_COOKIE, "", REFRESH_PATH, Duration.ZERO).toString());
    }

    public Optional<String> readAccess(HttpServletRequest request) {
        return read(request, ACCESS_COOKIE);
    }

    public Optional<String> readRefresh(HttpServletRequest request) {
        return read(request, REFRESH_COOKIE);
    }

    private ResponseCookie build(String name, String value, String path, Duration maxAge) {
        ResponseCookie.ResponseCookieBuilder b = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(props.cookie().secure())
                .sameSite(props.cookie().sameSite())
                .path(path)
                .maxAge(maxAge);
        if (props.cookie().domain() != null && !props.cookie().domain().isBlank()) {
            b.domain(props.cookie().domain());
        }
        return b.build();
    }

    private Optional<String> read(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .filter(v -> v != null && !v.isBlank())
                .findFirst();
    }
}
