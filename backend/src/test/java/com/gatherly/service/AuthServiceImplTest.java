package com.gatherly.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.config.JwtProperties;
import com.gatherly.domain.GlobalRole;
import com.gatherly.domain.RefreshToken;
import com.gatherly.domain.User;
import com.gatherly.domain.UserStatus;
import com.gatherly.integration.email.EmailService;
import com.gatherly.repository.RefreshTokenRepository;
import com.gatherly.repository.UserRepository;
import com.gatherly.security.JwtService;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

/** Unit tests (Mockito, no Spring/Docker) for the security-critical auth paths. */
@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

  @Mock private UserRepository userRepository;
  @Mock private RefreshTokenRepository refreshTokenRepository;
  @Mock private JwtService jwtService;
  @Mock private OtpService otpService;
  @Mock private EmailService emailService;
  @Mock private PasswordEncoder passwordEncoder;

  private AuthServiceImpl authService;

  @BeforeEach
  void setUp() {
    authService =
        new AuthServiceImpl(
            userRepository,
            refreshTokenRepository,
            jwtService,
            otpService,
            emailService,
            passwordEncoder,
            new JwtProperties("secret", 900, 604800));
  }

  private User user(UserStatus status) {
    User u = new User();
    ReflectionTestUtils.setField(u, "id", UUID.randomUUID());
    u.setEmail("admin@example.com");
    u.setPasswordHash("$2b$10$hash");
    u.setGlobalRole(GlobalRole.ADMIN);
    u.setStatus(status);
    return u;
  }

  @Test
  void loginIssuesTokensForValidActiveUser() {
    User u = user(UserStatus.ACTIVE);
    when(userRepository.findByEmailIgnoreCase("admin@example.com")).thenReturn(Optional.of(u));
    when(passwordEncoder.matches("pw", "$2b$10$hash")).thenReturn(true);
    when(jwtService.issueAccessToken(u)).thenReturn("access-jwt");

    AuthTokens tokens = authService.login("admin@example.com", "pw");

    assertThat(tokens.accessToken()).isEqualTo("access-jwt");
    assertThat(tokens.refreshToken()).isNotBlank();
    verify(refreshTokenRepository).save(any(RefreshToken.class));
  }

  @Test
  void loginRejectsWrongPassword() {
    User u = user(UserStatus.ACTIVE);
    when(userRepository.findByEmailIgnoreCase("admin@example.com")).thenReturn(Optional.of(u));
    when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

    assertThatThrownBy(() -> authService.login("admin@example.com", "bad"))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getCode())
        .isEqualTo(ErrorCode.UNAUTHENTICATED);
    verify(refreshTokenRepository, never()).save(any());
  }

  @Test
  void loginRejectsInactiveUser() {
    User u = user(UserStatus.INACTIVE);
    when(userRepository.findByEmailIgnoreCase("admin@example.com")).thenReturn(Optional.of(u));
    when(passwordEncoder.matches("pw", "$2b$10$hash")).thenReturn(true);

    assertThatThrownBy(() -> authService.login("admin@example.com", "pw"))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getCode())
        .isEqualTo(ErrorCode.UNAUTHENTICATED);
  }

  @Test
  void reusingRevokedRefreshTokenRevokesWholeChain() {
    UUID userId = UUID.randomUUID();
    RefreshToken revoked = new RefreshToken();
    revoked.setUserId(userId);
    revoked.setRevoked(true);
    revoked.setExpiresAt(Instant.now().plusSeconds(1000));
    when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(revoked));

    assertThatThrownBy(() -> authService.refresh("some-raw-token"))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getCode())
        .isEqualTo(ErrorCode.UNAUTHENTICATED);
    verify(refreshTokenRepository).revokeAllForUser(eq(userId));
  }
}
