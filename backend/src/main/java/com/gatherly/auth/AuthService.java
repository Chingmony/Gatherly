package com.gatherly.auth;

import com.gatherly.auth.domain.RefreshToken;
import com.gatherly.auth.dto.LoginRequest;
import com.gatherly.auth.dto.ResetPasswordRequest;
import com.gatherly.user.domain.UserStatus;
import com.gatherly.common.Hashing;
import com.gatherly.common.error.AppException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.config.AuthProperties;
import com.gatherly.integration.email.EmailService;
import com.gatherly.security.AuthCookies;
import com.gatherly.security.JwtService;
import com.gatherly.user.UserRepository;
import com.gatherly.user.domain.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * Authentication flows (docs/03 §2.3, docs/06 §3): login, refresh-rotation, logout, and the
 * forgot-password OTP cycle. Public methods — the security gate is the filter chain
 * ({@code /auth/**} is permitAll), not {@code @PreAuthorize}.
 */
@Service
@Transactional
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final int REFRESH_TOKEN_BYTES = 32;

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final EmailService emailService;
    private final AuthCookies cookies;
    private final AuthProperties props;

    public AuthService(UserRepository users, RefreshTokenRepository refreshTokens,
                       PasswordEncoder passwordEncoder, JwtService jwtService, OtpService otpService,
                       EmailService emailService, AuthCookies cookies, AuthProperties props) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.otpService = otpService;
        this.emailService = emailService;
        this.cookies = cookies;
        this.props = props;
    }

    /**
     * Authenticate. An {@code ACTIVE} account logs in normally (cookies set) and yields a session
     * outcome. A {@code PENDING_ACTIVATION} (invited) account has no password — the submitted
     * "password" is treated as the one-time invite code; on a match we return a single-use grant
     * (no session) so the client can route the user to set a real password. Every failure is the
     * uniform {@code INVALID_CREDENTIALS} so neither account existence nor status leaks.
     */
    public LoginOutcome login(LoginRequest req, HttpServletResponse response) {
        User user = users.findByEmailIgnoreCase(req.email())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS, "Invalid email or password."));

        if (user.getStatus() == UserStatus.PENDING_ACTIVATION) {
            try {
                String grant = otpService.verifyOtp(user.getId(), req.password());
                return LoginOutcome.setupRequired(user.getEmail(), grant);
            } catch (AppException ex) {
                throw new AppException(ErrorCode.INVALID_CREDENTIALS, "Invalid email or password.");
            }
        }

        if (!user.isActive() || !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS, "Invalid email or password.");
        }
        issueSession(user, response);
        return LoginOutcome.session(user);
    }

    /**
     * Rotate the refresh token: revoke the presented one and issue a new pair. Presenting an
     * already-revoked token is treated as theft → the whole chain is revoked (docs/03 §2.3).
     *
     * <p>{@code noRollbackFor = AppException} so the chain-revocation in the reuse path is
     * committed even though we then throw to produce the {@code 401}.
     */
    @Transactional(noRollbackFor = AppException.class)
    public User refresh(HttpServletRequest request, HttpServletResponse response) {
        String raw = cookies.readRefresh(request)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED, "Missing refresh token."));
        RefreshToken token = refreshTokens.findByTokenHash(Hashing.sha256Hex(raw))
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED, "Invalid refresh token."));

        if (token.isRevoked()) {
            // Reuse of a revoked token → revoke the entire chain for the user.
            refreshTokens.revokeAllForUser(token.getUserId());
            cookies.clear(response);
            throw new AppException(ErrorCode.UNAUTHENTICATED, "Refresh token reuse detected.");
        }
        if (token.isExpired()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED, "Refresh token expired.");
        }
        User user = users.findById(token.getUserId())
                .filter(User::isActive)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED, "Account is not available."));

        token.setRevoked(true);
        IssuedRefresh rotated = issueRefreshToken(user);
        token.setReplacedBy(rotated.entity().getId());

        String access = jwtService.generateAccessToken(user);
        cookies.write(response, access, rotated.raw());
        return user;
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        cookies.readRefresh(request)
                .flatMap(raw -> refreshTokens.findByTokenHash(Hashing.sha256Hex(raw)))
                .ifPresent(t -> t.setRevoked(true));
        cookies.clear(response);
    }

    // ---- Forgot-password (OTP) ----------------------------------------------

    /**
     * Email a one-time code. Always succeeds from the caller's view (no account enumeration,
     * docs/04 §3.5). Works for an {@code ACTIVE} account (password reset) and for a
     * {@code PENDING_ACTIVATION} account (resend the invite code) — the latter fixes the dead-end
     * where an invited-but-not-activated user had no way to (re)request their code.
     */
    public void forgotPassword(String email) {
        Optional<User> found = users.findByEmailIgnoreCase(email).filter(this::isResettable);
        if (found.isEmpty()) {
            return; // do not reveal whether the account exists
        }
        User user = found.get();
        boolean pending = user.getStatus() == UserStatus.PENDING_ACTIVATION;
        try {
            if (pending) {
                int ttl = props.otp().inviteTtlSeconds();
                String otp = otpService.requestOtp(user.getId(), ttl);
                emailService.sendInviteOtp(user.getEmail(), user.getFullName(), otp, ttl / 60);
            } else {
                String otp = otpService.requestOtp(user.getId());
                emailService.sendOtp(user.getEmail(), user.getFullName(), otp, props.otp().ttlSeconds() / 60);
            }
        } catch (com.gatherly.common.error.RateLimitExceededException ex) {
            // Within resend cooldown — silently no-op to preserve the uniform 202 response.
            log.debug("OTP resend within cooldown for user {}", user.getId());
        }
    }

    public String verifyOtp(String email, String code) {
        User user = users.findByEmailIgnoreCase(email).filter(this::isResettable)
                .orElseThrow(() -> new AppException(ErrorCode.OTP_INVALID, "Incorrect code."));
        return otpService.verifyOtp(user.getId(), code);
    }

    /**
     * Set a password using a single-use grant from {@link #verifyOtp} or the invite-login flow.
     * One path for both: a {@code PENDING_ACTIVATION} account is activated ({@code → ACTIVE}) as it
     * sets its first password; an {@code ACTIVE} account has its password reset. Existing sessions
     * are revoked afterwards (docs/03 §2.3).
     */
    public void resetPassword(ResetPasswordRequest req) {
        User user = users.findByEmailIgnoreCase(req.email()).filter(this::isResettable)
                .orElseThrow(() -> new AppException(ErrorCode.OTP_INVALID, "Invalid or expired reset request."));
        if (!otpService.consumeGrant(user.getId(), req.resetGrant())) {
            throw new AppException(ErrorCode.OTP_INVALID, "Invalid or expired reset request.");
        }
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        if (user.getStatus() == UserStatus.PENDING_ACTIVATION) {
            user.setStatus(UserStatus.ACTIVE); // activate the invited account on first password
        }
        users.save(user);
        refreshTokens.revokeAllForUser(user.getId());
    }

    /** OTP flows apply to live accounts (ACTIVE) and invited ones (PENDING_ACTIVATION), not INACTIVE. */
    private boolean isResettable(User u) {
        return u.getStatus() == UserStatus.ACTIVE || u.getStatus() == UserStatus.PENDING_ACTIVATION;
    }

    // ---- helpers ------------------------------------------------------------

    private void issueSession(User user, HttpServletResponse response) {
        IssuedRefresh rt = issueRefreshToken(user);
        String access = jwtService.generateAccessToken(user);
        cookies.write(response, access, rt.raw());
    }

    /** Generates a refresh token, persisting only its hash and returning the raw value to set as a cookie. */
    private IssuedRefresh issueRefreshToken(User user) {
        String raw = Hashing.randomToken(REFRESH_TOKEN_BYTES);
        Instant expiresAt = Instant.now().plus(props.jwt().refreshTtl());
        RefreshToken rt = refreshTokens.save(new RefreshToken(user.getId(), Hashing.sha256Hex(raw), expiresAt));
        return new IssuedRefresh(rt, raw);
    }

    private record IssuedRefresh(RefreshToken entity, String raw) {
    }
}
