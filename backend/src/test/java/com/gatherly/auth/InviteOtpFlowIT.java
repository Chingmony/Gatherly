package com.gatherly.auth;

import com.gatherly.AbstractIntegrationTest;
import com.gatherly.support.HttpTestClient;
import com.gatherly.user.UserRepository;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.User;
import com.gatherly.user.domain.UserStatus;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.GreenMailUtil;
import com.icegreen.greenmail.util.ServerSetupTest;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Invite-by-OTP flow (docs/04 §3.2, docs/06 §3a): an admin invites a user; the user receives a
 * one-time code by email; entering email + code on the login page detects the OTP and hands back a
 * single-use grant; the user then sets a password (activating the account) and logs in normally.
 * Validated against an in-memory GreenMail SMTP (CLAUDE.md test matrix — never a mocked sender).
 */
class InviteOtpFlowIT extends AbstractIntegrationTest {

    @RegisterExtension
    static final GreenMailExtension MAIL = new GreenMailExtension(ServerSetupTest.SMTP);

    @DynamicPropertySource
    static void mailProps(DynamicPropertyRegistry registry) {
        registry.add("spring.mail.host", () -> "127.0.0.1");
        registry.add("spring.mail.port", () -> ServerSetupTest.SMTP.getPort());
        registry.add("gatherly.email.enabled", () -> true);
    }

    private static final Pattern OTP = Pattern.compile("(\\d{6})");
    private static final Pattern GRANT = Pattern.compile("\"resetGrant\":\"([^\"]+)\"");
    private static final String ADMIN_PW = "Admin123!";

    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired RefreshTokenRepository refreshTokens;
    @Autowired OtpService otpService;
    @Autowired PasswordEncoder encoder;

    @BeforeEach
    void seed() {
        refreshTokens.deleteAll();
        users.deleteAll();
        User admin = new User();
        admin.setEmail("admin@gatherly.test");
        admin.setPasswordHash(encoder.encode(ADMIN_PW));
        admin.setFullName("Admin");
        admin.setGlobalRole(GlobalRole.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        users.save(admin);
    }

    @Test
    void inviteEmailsOtpThenLoginRedeemsItAndSetsPassword() throws Exception {
        HttpTestClient admin = new HttpTestClient(port);
        login(admin, "admin@gatherly.test", ADMIN_PW);

        // 1. Admin invites a user (no password) → PENDING_ACTIVATION.
        HttpResponse<String> invite = admin.post("/api/v1/users",
                "{\"fullName\":\"New User\",\"email\":\"invitee@gatherly.test\",\"role\":\"HANDLER\"}");
        assertThat(invite.statusCode()).isEqualTo(201);
        assertThat(invite.body()).contains("PENDING_ACTIVATION").doesNotContain("passwordHash");

        // 2. A one-time code is emailed to the invitee.
        assertThat(MAIL.waitForIncomingEmail(5000, 1)).isTrue();
        MimeMessage msg = MAIL.getReceivedMessages()[0];
        assertThat(msg.getSubject()).contains("sign-in code");
        assertThat(msg.getAllRecipients()[0].toString()).isEqualTo("invitee@gatherly.test");
        String code = extract(OTP, GreenMailUtil.getBody(msg));

        // 3. Entering email + code on the login page → setup required + a single-use grant (no session).
        HttpTestClient invitee = new HttpTestClient(port);
        HttpResponse<String> redeem = login(invitee, "invitee@gatherly.test", code);
        assertThat(redeem.statusCode()).isEqualTo(200);
        assertThat(redeem.body()).contains("\"setupRequired\":true");
        // No session yet — the grant must be used to set a password first.
        assertThat(invitee.get("/api/v1/me").statusCode()).isEqualTo(401);
        String grant = extract(GRANT, redeem.body());

        // 4. Set a password with the grant → account activates.
        HttpResponse<String> set = invitee.post("/api/v1/auth/reset-password",
                "{\"email\":\"invitee@gatherly.test\",\"resetGrant\":\"%s\",\"newPassword\":\"Activate123!\"}"
                        .formatted(grant));
        assertThat(set.statusCode()).isEqualTo(204);
        assertThat(users.findByEmailIgnoreCase("invitee@gatherly.test").orElseThrow().getStatus())
                .isEqualTo(UserStatus.ACTIVE);

        // 5. The user can now log in normally with the chosen password.
        HttpTestClient active = new HttpTestClient(port);
        HttpResponse<String> normal = login(active, "invitee@gatherly.test", "Activate123!");
        assertThat(normal.statusCode()).isEqualTo(200);
        assertThat(normal.body()).contains("invitee@gatherly.test");
        assertThat(active.get("/api/v1/me").statusCode()).isEqualTo(200);
    }

    @Test
    void wrongInviteCodeIsUniformInvalidCredentials() {
        User pending = new User();
        pending.setEmail("pending@gatherly.test");
        pending.setFullName("Pending");
        pending.setGlobalRole(GlobalRole.MEMBER);
        pending.setStatus(UserStatus.PENDING_ACTIVATION);
        otpService.requestOtp(users.save(pending).getId(), 86400); // a real code exists

        HttpResponse<String> res = login(new HttpTestClient(port), "pending@gatherly.test", "000000");
        assertThat(res.statusCode()).isEqualTo(401);
        assertThat(res.body()).contains("INVALID_CREDENTIALS"); // never leaks that the account is pending
    }

    @Test
    void grantIsSingleUse() {
        User pending = new User();
        pending.setEmail("once@gatherly.test");
        pending.setFullName("Once");
        pending.setGlobalRole(GlobalRole.MEMBER);
        pending.setStatus(UserStatus.PENDING_ACTIVATION);
        String code = otpService.requestOtp(users.save(pending).getId(), 86400);

        HttpTestClient c = new HttpTestClient(port);
        String grant = extract(GRANT, login(c, "once@gatherly.test", code).body());
        String body = "{\"email\":\"once@gatherly.test\",\"resetGrant\":\"%s\",\"newPassword\":\"Activate123!\"}"
                .formatted(grant);

        assertThat(c.post("/api/v1/auth/reset-password", body).statusCode()).isEqualTo(204);
        // Reuse of the consumed grant is rejected.
        HttpResponse<String> reuse = c.post("/api/v1/auth/reset-password", body);
        assertThat(reuse.statusCode()).isEqualTo(401);
        assertThat(reuse.body()).contains("OTP_INVALID");
    }

    private HttpResponse<String> login(HttpTestClient c, String email, String password) {
        return c.post("/api/v1/auth/login",
                "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password));
    }

    private static String extract(Pattern p, String s) {
        Matcher m = p.matcher(s);
        assertThat(m.find()).as("pattern %s in %s", p, s).isTrue();
        return m.group(1);
    }
}
