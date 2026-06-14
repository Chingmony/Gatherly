package com.gatherly.dashboard;

import com.gatherly.AbstractIntegrationTest;
import com.gatherly.auth.RefreshTokenRepository;
import com.gatherly.event.EventRepository;
import com.gatherly.event.domain.Event;
import com.gatherly.event.domain.EventStatus;
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
 * Admin Command Center authorization + aggregate shape (docs/03 §4.13, docs/06 §11). The endpoint
 * is Admin-only (gate on the service layer): unauthenticated → 401, MEMBER → 403, ADMIN → 200 with
 * the lifecycle/registration/events payload reflecting seeded events.
 */
class DashboardFlowIT extends AbstractIntegrationTest {

    @LocalServerPort
    int port;
    @Autowired
    UserRepository users;
    @Autowired
    EventRepository events;
    @Autowired
    RefreshTokenRepository refreshTokens;
    @Autowired
    PasswordEncoder encoder;

    private static final String ADMIN_PW = "Admin123!";
    private static final String MEMBER_PW = "Member123!";

    @BeforeEach
    void seed() {
        refreshTokens.deleteAll();
        events.deleteAll();
        users.deleteAll();
        save("admin@gatherly.test", ADMIN_PW, GlobalRole.ADMIN);
        save("member@gatherly.test", MEMBER_PW, GlobalRole.MEMBER);
        saveEvent("Live Summit", EventStatus.PUBLIC, "live-summit");
        saveEvent("Draft Mixer", EventStatus.DRAFT, "draft-mixer");
    }

    @Test
    void unauthenticatedIsRejected() {
        assertThat(new HttpTestClient(port).get("/api/v1/dashboard/command-center").statusCode())
                .isEqualTo(401);
    }

    @Test
    void memberIsForbidden() {
        HttpTestClient member = new HttpTestClient(port);
        login(member, "member@gatherly.test", MEMBER_PW);
        HttpResponse<String> res = member.get("/api/v1/dashboard/command-center");
        assertThat(res.statusCode()).isEqualTo(403);
        assertThat(res.body()).contains("FORBIDDEN");
    }

    @Test
    void adminGetsLifecycleAndControlFeed() {
        HttpTestClient admin = new HttpTestClient(port);
        login(admin, "admin@gatherly.test", ADMIN_PW);
        HttpResponse<String> res = admin.get("/api/v1/dashboard/command-center");

        assertThat(res.statusCode()).isEqualTo(200);
        String body = res.body();
        // Lifecycle counts reflect the two seeded events (1 live + 1 draft).
        assertThat(body).contains("\"total\":2").contains("\"live\":1").contains("\"draft\":1");
        // Control feed carries both events; material domain is absent in this slice
        // (materialHealth is null → omitted by JsonInclude.NON_NULL; critical is an empty array).
        assertThat(body).contains("Live Summit").contains("Draft Mixer");
        assertThat(body).contains("\"critical\":[]").doesNotContain("\"materialHealth\":{");
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

    private void saveEvent(String title, EventStatus status, String slug) {
        Event e = new Event();
        e.setTitle(title);
        e.setSlug(slug);
        e.setStatus(status);
        e.setCoverGradient("a");
        events.save(e);
    }
}
