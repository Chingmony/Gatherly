package com.gatherly.hardening;

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
 * M9 hardening surface (docs/08, docs/10): secure response headers, actuator lockdown, the
 * privileged-action audit trail (+ its Admin-only read), and the Admin-gated right-to-erasure.
 */
class HardeningFlowIT extends AbstractIntegrationTest {

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
        save("admin@gatherly.test", ADMIN_PW, GlobalRole.ADMIN);
        save("member@gatherly.test", MEMBER_PW, GlobalRole.MEMBER);
    }

    @Test
    void secureHeadersArePresent() {
        HttpResponse<String> res = new HttpTestClient(port).get("/actuator/health");
        assertThat(res.headers().firstValue("X-Frame-Options")).hasValue("DENY");
        assertThat(res.headers().firstValue("X-Content-Type-Options")).hasValue("nosniff");
        assertThat(res.headers().firstValue("Content-Security-Policy")).isPresent();
        assertThat(res.headers().firstValue("Referrer-Policy")).isPresent();
    }

    @Test
    void actuatorIsLockedDownButHealthStaysPublic() {
        HttpTestClient anon = new HttpTestClient(port);
        assertThat(anon.get("/actuator/health").statusCode()).isEqualTo(200);   // liveness public
        assertThat(anon.get("/actuator/prometheus").statusCode()).isEqualTo(401); // M9 lockdown
    }

    @Test
    void privilegedActionIsAuditedAndAuditIsAdminOnly() {
        UUID target = save("target@gatherly.test", MEMBER_PW, GlobalRole.MEMBER).getId();

        HttpTestClient admin = new HttpTestClient(port);
        login(admin, "admin@gatherly.test", ADMIN_PW);
        assertThat(admin.delete("/api/v1/users/" + target).statusCode()).isEqualTo(204);

        // The deletion is recorded, and only an Admin can read the trail.
        HttpResponse<String> trail = admin.get("/api/v1/audit-log");
        assertThat(trail.statusCode()).isEqualTo(200);
        assertThat(trail.body()).contains("USER_DELETED").contains(target.toString());

        HttpTestClient member = new HttpTestClient(port);
        login(member, "member@gatherly.test", MEMBER_PW);
        assertThat(member.get("/api/v1/audit-log").statusCode()).isEqualTo(403);
    }

    @Test
    void erasureIsAdminGated() {
        HttpTestClient member = new HttpTestClient(port);
        login(member, "member@gatherly.test", MEMBER_PW);
        assertThat(member.delete("/api/v1/admin/guest-data?email=x@y.test").statusCode()).isEqualTo(403);

        HttpTestClient admin = new HttpTestClient(port);
        login(admin, "admin@gatherly.test", ADMIN_PW);
        HttpResponse<String> res = admin.delete("/api/v1/admin/guest-data?email=none@gatherly.test");
        assertThat(res.statusCode()).isEqualTo(200);
        assertThat(res.body()).contains("\"erased\":0");
    }

    private HttpResponse<String> login(HttpTestClient c, String email, String password) {
        return c.post("/api/v1/auth/login",
                "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password));
    }

    private User save(String email, String rawPw, GlobalRole role) {
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(rawPw));
        u.setFullName("Test " + role);
        u.setGlobalRole(role);
        u.setStatus(UserStatus.ACTIVE);
        return users.save(u);
    }
}
