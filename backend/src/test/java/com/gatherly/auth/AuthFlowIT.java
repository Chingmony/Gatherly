package com.gatherly.auth;

import com.gatherly.AbstractIntegrationTest;
import com.gatherly.support.HttpTestClient;
import com.gatherly.user.UserRepository;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.User;
import com.gatherly.user.domain.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.net.http.HttpResponse;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Authorization-matrix + auth-flow coverage (docs/09 §2.3) — these gates are release-blocking.
 * Drives real HTTP with cookie-based sessions to exercise the filter chain end to end.
 */
class AuthFlowIT extends AbstractIntegrationTest {

    @LocalServerPort
    int port;
    @Autowired
    UserRepository users;
    @Autowired
    com.gatherly.auth.RefreshTokenRepository refreshTokens;
    @Autowired
    PasswordEncoder encoder;

    private static final String ADMIN_PW = "Admin123!";
    private static final String MEMBER_PW = "Member123!";

    @BeforeEach
    void seed() {
        refreshTokens.deleteAll();
        users.deleteAll();
        save("admin@gatherly.test", ADMIN_PW, GlobalRole.ADMIN, UserStatus.ACTIVE);
        save("member@gatherly.test", MEMBER_PW, GlobalRole.MEMBER, UserStatus.ACTIVE);
        save("inactive@gatherly.test", MEMBER_PW, GlobalRole.MEMBER, UserStatus.INACTIVE);
    }

    @Test
    void adminLogsInAndReadsUsers() {
        HttpTestClient c = new HttpTestClient(port);
        assertThat(login(c, "admin@gatherly.test", ADMIN_PW).statusCode()).isEqualTo(200);

        HttpResponse<String> me = c.get("/api/v1/me");
        assertThat(me.statusCode()).isEqualTo(200);
        assertThat(me.body()).contains("admin@gatherly.test").contains("ADMIN");

        assertThat(c.get("/api/v1/users").statusCode()).isEqualTo(200);
    }

    @Test
    void memberCanReadUserListButNotManage() {
        HttpTestClient c = new HttpTestClient(port);
        login(c, "member@gatherly.test", MEMBER_PW);

        // Organizers may VIEW the team roster (read-only)...
        assertThat(c.get("/api/v1/users").statusCode()).isEqualTo(200);
        assertThat(c.get("/api/v1/me").statusCode()).isEqualTo(200);

        // ...but every mutation stays Admin-only.
        HttpResponse<String> invite = c.post("/api/v1/users",
                "{\"fullName\":\"X\",\"email\":\"x@gatherly.test\",\"role\":\"HANDLER\"}");
        assertThat(invite.statusCode()).isEqualTo(403);
        assertThat(invite.body()).contains("FORBIDDEN");
    }

    @Test
    void unauthenticatedIsRejected() {
        HttpResponse<String> res = new HttpTestClient(port).get("/api/v1/users");
        assertThat(res.statusCode()).isEqualTo(401);
        assertThat(res.body()).contains("UNAUTHENTICATED");
    }

    @Test
    void badPasswordIsInvalidCredentials() {
        HttpResponse<String> res = login(new HttpTestClient(port), "admin@gatherly.test", "wrong");
        assertThat(res.statusCode()).isEqualTo(401);
        assertThat(res.body()).contains("INVALID_CREDENTIALS");
    }

    @Test
    void inactiveAccountCannotLogin() {
        HttpResponse<String> res = login(new HttpTestClient(port), "inactive@gatherly.test", MEMBER_PW);
        assertThat(res.statusCode()).isEqualTo(401);
    }

    @Test
    void adminInvitesUserAsPendingActivation() {
        HttpTestClient c = new HttpTestClient(port);
        login(c, "admin@gatherly.test", ADMIN_PW);
        // Invite: no password; role is the Sub-admin/Handler designation (docs/03 §4.2).
        String body = """
                {"fullName":"New User","email":"new.user@gatherly.test","role":"SUB_ADMIN"}
                """;
        HttpResponse<String> res = c.post("/api/v1/users", body);
        assertThat(res.statusCode()).isEqualTo(201);
        assertThat(res.body())
                .contains("new.user@gatherly.test")
                .contains("PENDING_ACTIVATION")
                .contains("MANAGER")     // SUB_ADMIN → default_event_role MANAGER
                .doesNotContain("passwordHash");

        User invited = users.findByEmailIgnoreCase("new.user@gatherly.test").orElseThrow();
        assertThat(invited.getStatus()).isEqualTo(UserStatus.PENDING_ACTIVATION);
        assertThat(invited.getGlobalRole()).isEqualTo(GlobalRole.MEMBER); // never a global admin
        assertThat(invited.getPasswordHash()).isNull();

        // The invited user cannot log in until they activate (no password).
        HttpResponse<String> attempt = login(new HttpTestClient(port), "new.user@gatherly.test", "anything12");
        assertThat(attempt.statusCode()).isEqualTo(401);
    }

    @Test
    void onlyAdminCanDeleteUser() {
        UUID targetId = save("target@gatherly.test", MEMBER_PW, GlobalRole.MEMBER, UserStatus.ACTIVE).getId();

        // Member is forbidden (stands in for the sub-admin restriction, docs/00 §5).
        HttpTestClient member = new HttpTestClient(port);
        login(member, "member@gatherly.test", MEMBER_PW);
        assertThat(member.delete("/api/v1/users/" + targetId).statusCode()).isEqualTo(403);

        // Admin hard-deletes the user.
        HttpTestClient admin = new HttpTestClient(port);
        login(admin, "admin@gatherly.test", ADMIN_PW);
        assertThat(admin.delete("/api/v1/users/" + targetId).statusCode()).isEqualTo(204);
        assertThat(users.findById(targetId)).isEmpty();
    }

    @Test
    void logoutEndsSession() {
        HttpTestClient c = new HttpTestClient(port);
        login(c, "admin@gatherly.test", ADMIN_PW);
        assertThat(c.get("/api/v1/me").statusCode()).isEqualTo(200);

        assertThat(c.post("/api/v1/auth/logout", "").statusCode()).isEqualTo(204);
        assertThat(c.get("/api/v1/me").statusCode()).isEqualTo(401);
    }

    private HttpResponse<String> login(HttpTestClient c, String email, String password) {
        return c.post("/api/v1/auth/login",
                "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password));
    }

    private User save(String email, String rawPw, GlobalRole role, UserStatus status) {
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(rawPw));
        u.setFullName("Test " + role);
        u.setGlobalRole(role);
        u.setStatus(status);
        return users.save(u);
    }
}
