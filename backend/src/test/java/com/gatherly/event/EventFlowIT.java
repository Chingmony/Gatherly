package com.gatherly.event;

import com.gatherly.AbstractIntegrationTest;
import com.gatherly.auth.RefreshTokenRepository;
import com.gatherly.support.HttpTestClient;
import com.gatherly.user.UserRepository;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.User;
import com.gatherly.user.domain.UserStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Event CRUD + lifecycle authorization matrix (docs/03 §4.4, docs/09 §2.3) — release-blocking
 * gates exercised end to end over real HTTP with cookie sessions.
 */
class EventFlowIT extends AbstractIntegrationTest {

    private static final Pattern ID = Pattern.compile("\"id\":\"([0-9a-f-]{36})\"");

    @LocalServerPort
    int port;
    @Autowired
    UserRepository users;
    @Autowired
    EventRepository eventRepo;
    @Autowired
    RefreshTokenRepository refreshTokens;
    @Autowired
    PasswordEncoder encoder;

    private static final String ADMIN_PW = "Admin123!";
    private static final String MEMBER_PW = "Member123!";

    @BeforeEach
    void seed() {
        // event.created_by references user with no cascade, so clear events before users.
        eventRepo.deleteAll();
        refreshTokens.deleteAll();
        users.deleteAll();
        save("admin@gatherly.test", ADMIN_PW, GlobalRole.ADMIN);
        save("member@gatherly.test", MEMBER_PW, GlobalRole.MEMBER);
    }

    @AfterEach
    void cleanup() {
        // Leave no events behind — other test classes' users.deleteAll() would hit the FK otherwise.
        eventRepo.deleteAll();
    }

    @Test
    void adminCreatesPublishesAndArchivesEvent() {
        HttpTestClient admin = adminClient();

        HttpResponse<String> created = admin.post("/api/v1/events",
                "{\"title\":\"Annual Gala\",\"venue\":\"Grand Hall\"}");
        assertThat(created.statusCode()).isEqualTo(201);
        assertThat(created.body()).contains("\"status\":\"DRAFT\"").contains("\"slug\":\"annual-gala\"");
        String id = idOf(created.body());

        HttpResponse<String> published = admin.post("/api/v1/events/" + id + "/publish", "");
        assertThat(published.statusCode()).isEqualTo(200);
        assertThat(published.body()).contains("\"status\":\"PUBLIC\"");

        // Re-publish is illegal (only DRAFT → PUBLIC).
        assertThat(admin.post("/api/v1/events/" + id + "/publish", "").statusCode()).isEqualTo(409);

        HttpResponse<String> archived = admin.post("/api/v1/events/" + id + "/archive", "");
        assertThat(archived.statusCode()).isEqualTo(200);
        assertThat(archived.body()).contains("\"status\":\"ARCHIVED\"");
    }

    @Test
    void memberCannotCreateOrDeleteEvent() {
        // Admin creates the event.
        HttpTestClient admin = adminClient();
        String id = idOf(admin.post("/api/v1/events", "{\"title\":\"Locked Event\"}").body());

        // Member (stands in for the sub-admin restriction, docs/00 §5) is forbidden.
        HttpTestClient member = new HttpTestClient(port);
        login(member, "member@gatherly.test", MEMBER_PW);
        assertThat(member.post("/api/v1/events", "{\"title\":\"Nope\"}").statusCode()).isEqualTo(403);
        assertThat(member.delete("/api/v1/events/" + id).statusCode()).isEqualTo(403);

        // Admin can hard-delete.
        assertThat(admin.delete("/api/v1/events/" + id).statusCode()).isEqualTo(204);
        assertThat(eventRepo.findById(java.util.UUID.fromString(id))).isEmpty();
    }

    @Test
    void unknownEventIsNotFound() {
        HttpTestClient admin = adminClient();
        HttpResponse<String> res = admin.get("/api/v1/events/00000000-0000-0000-0000-000000000099");
        assertThat(res.statusCode()).isEqualTo(404);
        assertThat(res.body()).contains("NOT_FOUND");
    }

    @Test
    void endBeforeStartIsRejected() {
        HttpTestClient admin = adminClient();
        HttpResponse<String> res = admin.post("/api/v1/events",
                "{\"title\":\"Bad Times\",\"startsAt\":\"2026-07-01T10:00:00Z\",\"endsAt\":\"2026-07-01T09:00:00Z\"}");
        assertThat(res.statusCode()).isEqualTo(400);
        assertThat(res.body()).contains("VALIDATION_ERROR");
    }

    @Test
    void unauthenticatedListIsRejected() {
        assertThat(new HttpTestClient(port).get("/api/v1/events").statusCode()).isEqualTo(401);
    }

    private HttpTestClient adminClient() {
        HttpTestClient c = new HttpTestClient(port);
        login(c, "admin@gatherly.test", ADMIN_PW);
        return c;
    }

    private HttpResponse<String> login(HttpTestClient c, String email, String password) {
        return c.post("/api/v1/auth/login",
                "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password));
    }

    private static String idOf(String json) {
        Matcher m = ID.matcher(json);
        if (!m.find()) {
            throw new AssertionError("No id in response: " + json);
        }
        return m.group(1);
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
