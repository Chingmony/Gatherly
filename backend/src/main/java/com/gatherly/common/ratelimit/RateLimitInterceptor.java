package com.gatherly.common.ratelimit;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;

/**
 * Per-IP abuse throttling on the auth + public surface (docs/10 §6, threats T10/T11). Registered
 * for the sensitive POST routes only ({@link com.gatherly.config.WebConfig}); on overflow it throws
 * {@link com.gatherly.common.error.RateLimitExceededException}, which the advice renders as
 * {@code 429 RATE_LIMITED} with {@code Retry-After}.
 */
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final RateLimitService rateLimit;
    private final boolean enabled;
    private final int loginLimit;
    private final int forgotLimit;
    private final int otpVerifyLimit;
    private final int registerLimit;
    private final int resendLimit;

    public RateLimitInterceptor(RateLimitService rateLimit,
                                @Value("${gatherly.rate-limit.enabled:true}") boolean enabled,
                                @Value("${gatherly.rate-limit.login:10}") int loginLimit,
                                @Value("${gatherly.rate-limit.forgot:5}") int forgotLimit,
                                @Value("${gatherly.rate-limit.otp-verify:10}") int otpVerifyLimit,
                                @Value("${gatherly.rate-limit.register:20}") int registerLimit,
                                @Value("${gatherly.rate-limit.resend:5}") int resendLimit) {
        this.rateLimit = rateLimit;
        this.enabled = enabled;
        this.loginLimit = loginLimit;
        this.forgotLimit = forgotLimit;
        this.otpVerifyLimit = otpVerifyLimit;
        this.registerLimit = registerLimit;
        this.resendLimit = resendLimit;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!enabled || !"POST".equalsIgnoreCase(request.getMethod())) {
            return true; // disabled, or a non-mutating method — nothing to throttle
        }
        String uri = request.getRequestURI();
        String ip = clientIp(request);

        if (uri.endsWith("/auth/login")) {
            rateLimit.check("login", ip, loginLimit, WINDOW);
        } else if (uri.endsWith("/auth/forgot-password")) {
            rateLimit.check("forgot", ip, forgotLimit, WINDOW);
        } else if (uri.endsWith("/auth/verify-otp")) {
            rateLimit.check("otp_verify", ip, otpVerifyLimit, WINDOW);
        } else if (uri.endsWith("/register") && uri.contains("/public/events/")) {
            rateLimit.check("register", ip, registerLimit, WINDOW);
        } else if (uri.endsWith("/resend") && uri.contains("/public/tickets/")) {
            rateLimit.check("resend", ip, resendLimit, WINDOW);
        }
        return true;
    }

    /** First hop of X-Forwarded-For (when behind a trusted proxy), else the socket address. */
    private String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
