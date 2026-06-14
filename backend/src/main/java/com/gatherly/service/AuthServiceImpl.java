package com.gatherly.service;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.config.JwtProperties;
import com.gatherly.domain.RefreshToken;
import com.gatherly.domain.User;
import com.gatherly.dto.auth.VerifyOtpResponse;
import com.gatherly.integration.email.EmailService;
import com.gatherly.repository.RefreshTokenRepository;
import com.gatherly.repository.UserRepository;
import com.gatherly.security.JwtService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** {@link AuthService} implementation — see {@code docs/03} §2.3 and {@code docs/06} §3. */
@Service
public class AuthServiceImpl implements AuthService {

  private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final JwtService jwtService;
  private final OtpService otpService;
  private final EmailService emailService;
  private final PasswordEncoder passwordEncoder;
  private final Duration refreshTtl;
  private final SecureRandom random = new SecureRandom();

  public AuthServiceImpl(
      UserRepository userRepository,
      RefreshTokenRepository refreshTokenRepository,
      JwtService jwtService,
      OtpService otpService,
      EmailService emailService,
      PasswordEncoder passwordEncoder,
      JwtProperties jwtProperties) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.jwtService = jwtService;
    this.otpService = otpService;
    this.emailService = emailService;
    this.passwordEncoder = passwordEncoder;
    this.refreshTtl = Duration.ofSeconds(jwtProperties.refreshTokenTtlSeconds());
  }

  @Override
  @Transactional
  public AuthTokens login(String email, String password) {
    User user =
        userRepository
            .findByEmailIgnoreCase(email)
            .orElseThrow(AuthServiceImpl::invalidCredentials);
    if (!passwordEncoder.matches(password, user.getPasswordHash()) || !user.isActive()) {
      throw invalidCredentials();
    }
    return issuePair(user);
  }

  @Override
  @Transactional
  public AuthTokens refresh(String rawRefreshToken) {
    if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
      throw new ApiException(ErrorCode.UNAUTHENTICATED, "Missing refresh token.");
    }
    String hash = sha256(rawRefreshToken);
    RefreshToken token =
        refreshTokenRepository
            .findByTokenHash(hash)
            .orElseThrow(
                () -> new ApiException(ErrorCode.UNAUTHENTICATED, "Invalid refresh token."));

    // Reuse of an already-rotated (revoked) token → compromise: revoke the whole chain.
    if (token.isRevoked()) {
      refreshTokenRepository.revokeAllForUser(token.getUserId());
      log.warn("Refresh-token reuse detected for user {} — chain revoked", token.getUserId());
      throw new ApiException(ErrorCode.UNAUTHENTICATED, "Refresh token reuse detected.");
    }
    if (!token.isActive(Instant.now())) {
      throw new ApiException(ErrorCode.UNAUTHENTICATED, "Refresh token has expired.");
    }
    User user =
        userRepository
            .findById(token.getUserId())
            .filter(User::isActive)
            .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHENTICATED, "Account unavailable."));

    AuthTokens pair = issuePair(user);
    token.setRevoked(true);
    refreshTokenRepository
        .findByTokenHash(sha256(pair.refreshToken()))
        .ifPresent(fresh -> token.setReplacedBy(fresh.getId()));
    return pair;
  }

  @Override
  @Transactional
  public void logout(String rawRefreshToken) {
    if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
      return; // idempotent
    }
    refreshTokenRepository
        .findByTokenHash(sha256(rawRefreshToken))
        .ifPresent(t -> t.setRevoked(true));
  }

  @Override
  @Transactional(readOnly = true)
  public void forgotPassword(String email) {
    userRepository
        .findByEmailIgnoreCase(email)
        .filter(User::isActive)
        .ifPresent(
            user -> {
              try {
                String otp = otpService.issue(user.getId());
                emailService.sendOtp(
                    user.getEmail(), user.getFullName(), otp, otpService.ttlMinutes());
              } catch (ApiException ex) {
                // Cooldown/rate-limit — swallow so the response stays a uniform 202 (no
                // enumeration).
                log.debug("OTP issue suppressed for {}: {}", user.getId(), ex.getMessage());
              }
            });
  }

  @Override
  @Transactional(readOnly = true)
  public VerifyOtpResponse verifyOtp(String email, String otp) {
    User user =
        userRepository
            .findByEmailIgnoreCase(email)
            .orElseThrow(
                () ->
                    new ApiException(
                        ErrorCode.VALIDATION_ERROR, "The code is invalid or has expired."));
    String grant = otpService.verify(user.getId(), otp);
    return new VerifyOtpResponse(grant, (long) otpService.ttlMinutes() * 60);
  }

  @Override
  @Transactional
  public void resetPassword(String email, String resetToken, String newPassword) {
    User user =
        userRepository
            .findByEmailIgnoreCase(email)
            .orElseThrow(
                () -> new ApiException(ErrorCode.VALIDATION_ERROR, "Invalid reset request."));
    if (!otpService.consumeGrant(user.getId(), resetToken)) {
      throw new ApiException(ErrorCode.VALIDATION_ERROR, "The reset token is invalid or expired.");
    }
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    refreshTokenRepository.revokeAllForUser(user.getId()); // log out all sessions
  }

  private AuthTokens issuePair(User user) {
    String access = jwtService.issueAccessToken(user);
    String rawRefresh = generateRefreshToken();
    RefreshToken entity = new RefreshToken();
    entity.setUserId(user.getId());
    entity.setTokenHash(sha256(rawRefresh));
    entity.setExpiresAt(Instant.now().plus(refreshTtl));
    refreshTokenRepository.save(entity);
    return new AuthTokens(user, access, rawRefresh);
  }

  private String generateRefreshToken() {
    byte[] bytes = new byte[32];
    random.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private static ApiException invalidCredentials() {
    return new ApiException(ErrorCode.UNAUTHENTICATED, "Invalid email or password.");
  }

  private static String sha256(String value) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      return HexFormat.of().formatHex(md.digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 unavailable", e);
    }
  }
}
