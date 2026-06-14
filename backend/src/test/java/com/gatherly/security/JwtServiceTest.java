package com.gatherly.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.gatherly.config.JwtProperties;
import com.gatherly.domain.GlobalRole;
import com.gatherly.domain.User;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

/** Pure unit test (no Spring/Docker) for JWT issue/parse round-trip and tamper rejection. */
class JwtServiceTest {

  private final JwtService jwtService =
      new JwtService(
          new JwtProperties(
              "unit-test-secret-key-at-least-256-bits-long-for-hmac-sha256!!", 900, 604800));

  private User user(GlobalRole role) {
    User u = new User();
    ReflectionTestUtils.setField(u, "id", UUID.randomUUID());
    u.setEmail("admin@example.com");
    u.setGlobalRole(role);
    return u;
  }

  @Test
  void issuedTokenParsesBackToPrincipal() {
    User u = user(GlobalRole.ADMIN);
    String token = jwtService.issueAccessToken(u);

    var principal = jwtService.parse(token);

    assertThat(principal).isPresent();
    assertThat(principal.get().id()).isEqualTo(u.getId());
    assertThat(principal.get().email()).isEqualTo("admin@example.com");
    assertThat(principal.get().role()).isEqualTo(GlobalRole.ADMIN);
  }

  @Test
  void tamperedTokenIsRejected() {
    String token = jwtService.issueAccessToken(user(GlobalRole.MEMBER));
    String tampered = token.substring(0, token.length() - 2) + "xy";

    assertThat(jwtService.parse(tampered)).isEmpty();
  }

  @Test
  void garbageTokenIsRejected() {
    assertThat(jwtService.parse("not-a-jwt")).isEmpty();
  }
}
