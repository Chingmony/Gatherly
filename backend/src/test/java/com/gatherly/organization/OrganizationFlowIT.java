package com.gatherly.organization;

import com.gatherly.AbstractIntegrationTest;
import com.gatherly.auth.RefreshTokenRepository;
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

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Organization profile authorization (docs/03 §4.3): reads are open to any authenticated user;
 * writes are Admin-only. The singleton row is seeded by Flyway ({@code V2__seed.sql}).
 */
class OrganizationFlowIT extends AbstractIntegrationTest {

    @LocalServerPort
    int port;
    @Autowired
    UserRepository users;
    @Autowired
    RefreshTokenRepository refreshTokens;
    @Autowired
    PasswordEncoder encoder;

    private static final String ADMIN_PW = "Admin123!";
    private static final String MEMBER_PW = "Member123!";

    @BeforeEach
    void seed() {
        refreshTokens.deleteAll();
        users.deleteAll();
        save("admin@gatherly.test", ADMIN_PW, GlobalRole.ADMIN);
        save("member@gatherly.test", MEMBER_PW, GlobalRole.MEMBER);
    }

    @Test
    void anyAuthenticatedUserCanReadProfile() {
        HttpTestClient member = new HttpTestClient(port);
        login(member, "member@gatherly.test", MEMBER_PW);
        HttpResponse<String> res = member.get("/api/v1/organization");
        assertThat(res.statusCode()).isEqualTo(200);
        assertThat(res.body()).contains("\"name\"");
    }

    @Test
    void adminCanUpdateProfile() {
        HttpTestClient admin = new HttpTestClient(port);
        login(admin, "admin@gatherly.test", ADMIN_PW);
        HttpResponse<String> res = admin.put("/api/v1/organization",
                "{\"name\":\"Acme Events\",\"contactEmail\":\"ops@acme.test\",\"logoKey\":\"org/logo/abc.png\"}");
        assertThat(res.statusCode()).isEqualTo(200);
        assertThat(res.body()).contains("Acme Events").contains("org/logo/abc.png");

        // Persisted: a fresh read reflects the change.
        assertThat(admin.get("/api/v1/organization").body()).contains("Acme Events");
    }

    @Test
    void memberCannotUpdateProfile() {
        HttpTestClient member = new HttpTestClient(port);
        login(member, "member@gatherly.test", MEMBER_PW);
        HttpResponse<String> res = member.put("/api/v1/organization", "{\"name\":\"Hijack Inc\"}");
        assertThat(res.statusCode()).isEqualTo(403);
        assertThat(res.body()).contains("FORBIDDEN");
    }

    @Test
    void blankNameIsRejected() {
        HttpTestClient admin = new HttpTestClient(port);
        login(admin, "admin@gatherly.test", ADMIN_PW);
        HttpResponse<String> res = admin.put("/api/v1/organization", "{\"name\":\"\"}");
        assertThat(res.statusCode()).isEqualTo(400);
        assertThat(res.body()).contains("VALIDATION_ERROR");
    }

    @Test
    void unauthenticatedIsRejected() {
        assertThat(new HttpTestClient(port).get("/api/v1/organization").statusCode()).isEqualTo(401);
    }

    private HttpResponse<String> login(HttpTestClient c, String email, String password) {
        return c.post("/api/v1/auth/login",
                "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password));
    }

    private void save(String email, String rawPw, GlobalRole role) {
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(rawPw));
        u.setFullName("Test " + role);
        u.setGlobalRole(role);
        u.setStatus(UserStatus.ACTIVE);
        users.save(u);
    }
}
