package com.gatherly.auth;

import com.gatherly.AbstractIntegrationTest;
import com.gatherly.support.HttpTestClient;
import com.gatherly.user.UserRepository;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.User;
import com.gatherly.user.domain.UserStatus;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Forgot-password account-discovery behaviour (docs/04 §3.5). Gatherly is invite-only, so a known
 * resettable account gets a {@code 202} (code sent) while an unknown email gets {@code 404
 * ACCOUNT_NOT_FOUND} — the UI then tells the person to contact an admin organizer. Wired against a
 * live GreenMail SMTP so the {@code ACTIVE}-account path actually delivers (CLAUDE.md test matrix).
 */
class ForgotPasswordFlowIT extends AbstractIntegrationTest {

    @RegisterExtension
    static final GreenMailExtension MAIL = new GreenMailExtension(ServerSetupTest.SMTP);

    @DynamicPropertySource
    static void mailProps(DynamicPropertyRegistry registry) {
        registry.add("spring.mail.host", () -> "127.0.0.1");
        registry.add("spring.mail.port", () -> ServerSetupTest.SMTP.getPort());
        registry.add("gatherly.email.enabled", () -> true);
    }

    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired RefreshTokenRepository refreshTokens;
    @Autowired PasswordEncoder encoder;

    @BeforeEach
    void seed() {
        refreshTokens.deleteAll();
        users.deleteAll();
        User active = new User();
        active.setEmail("organizer@gatherly.test");
        active.setPasswordHash(encoder.encode("Organizer123!"));
        active.setFullName("Organizer");
        active.setGlobalRole(GlobalRole.MEMBER);
        active.setStatus(UserStatus.ACTIVE);
        users.save(active);
    }

    @Test
    void knownAccountGetsCodeAndA202() throws Exception {
        HttpResponse<String> res = forgot("organizer@gatherly.test");
        assertThat(res.statusCode()).isEqualTo(202);
        assertThat(MAIL.waitForIncomingEmail(5000, 1)).isTrue();
    }

    @Test
    void unknownEmailIsToldToContactAnAdmin() {
        HttpResponse<String> res = forgot("nobody@gatherly.test");
        assertThat(res.statusCode()).isEqualTo(404);
        assertThat(res.body()).contains("ACCOUNT_NOT_FOUND").contains("contact your admin organizer");
    }

    @Test
    void deactivatedAccountIsTreatedAsUnknown() {
        User inactive = new User();
        inactive.setEmail("retired@gatherly.test");
        inactive.setPasswordHash(encoder.encode("Retired123!"));
        inactive.setFullName("Retired");
        inactive.setGlobalRole(GlobalRole.MEMBER);
        inactive.setStatus(UserStatus.INACTIVE);
        users.save(inactive);

        HttpResponse<String> res = forgot("retired@gatherly.test");
        assertThat(res.statusCode()).isEqualTo(404);
        assertThat(res.body()).contains("ACCOUNT_NOT_FOUND");
    }

    private HttpResponse<String> forgot(String email) {
        return new HttpTestClient(port).post("/api/v1/auth/forgot-password",
                "{\"email\":\"%s\"}".formatted(email));
    }
}
