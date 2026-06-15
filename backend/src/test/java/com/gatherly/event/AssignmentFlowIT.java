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
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Two-layer authorization matrix for event delegation (docs/03 §3/§4.5, docs/00 §5) —
 * release-blocking. Proves a Sub-admin (MANAGER) manages only their event, can never elevate or
 * touch the four absolute restrictions, and a Handler can view but not manage.
 */
class AssignmentFlowIT extends AbstractIntegrationTest {

    private static final Pattern ID = Pattern.compile("\"id\":\"([0-9a-f-]{36})\"");

    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired EventRepository eventRepo;
    @Autowired EventAssignmentRepository assignmentRepo;
    @Autowired RefreshTokenRepository refreshTokens;
    @Autowired PasswordEncoder encoder;

    private static final String PW = "Passw0rd!";
    private UUID member1Id;
    private UUID member2Id;

    @BeforeEach
    void seed() {
        assignmentRepo.deleteAll();
        eventRepo.deleteAll();
        refreshTokens.deleteAll();
        users.deleteAll();
        save("admin@gatherly.test", GlobalRole.ADMIN);
        member1Id = save("m1@gatherly.test", GlobalRole.MEMBER).getId();
        member2Id = save("m2@gatherly.test", GlobalRole.MEMBER).getId();
    }

    @AfterEach
    void cleanup() {
        assignmentRepo.deleteAll();
        eventRepo.deleteAll();
    }

    @Test
    void fullDelegationMatrix() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventA = idOf(admin.post("/api/v1/events", "{\"title\":\"Event A\"}").body());
        String eventB = idOf(admin.post("/api/v1/events", "{\"title\":\"Event B\"}").body());

        // Admin appoints member1 as Sub-admin (MANAGER) on Event A.
        HttpResponse<String> appoint = admin.post("/api/v1/events/" + eventA + "/assignments",
                "{\"userId\":\"%s\",\"role\":\"SUB_ADMIN\"}".formatted(member1Id));
        assertThat(appoint.statusCode()).isEqualTo(201);
        assertThat(appoint.body()).contains("MANAGER");

        HttpTestClient m1 = login("m1@gatherly.test");

        // MANAGER manages their event...
        assertThat(m1.get("/api/v1/events/" + eventA).statusCode()).isEqualTo(200);          // canView
        assertThat(m1.put("/api/v1/events/" + eventA, "{\"title\":\"Event A+\"}").statusCode()).isEqualTo(200); // canManage
        // ...but is blocked on Event B (not assigned).
        assertThat(m1.get("/api/v1/events/" + eventB).statusCode()).isEqualTo(403);
        assertThat(m1.put("/api/v1/events/" + eventB, "{\"title\":\"x\"}").statusCode()).isEqualTo(403);

        // Four absolute sub-admin restrictions (docs/00 §5) — all 403 for the MANAGER.
        assertThat(m1.delete("/api/v1/events/" + eventA).statusCode()).isEqualTo(403);        // delete event
        assertThat(m1.put("/api/v1/organization", "{\"name\":\"Hijack\"}").statusCode()).isEqualTo(403); // edit org
        assertThat(m1.delete("/api/v1/users/" + member2Id).statusCode()).isEqualTo(403);      // delete user

        // MANAGER may add a Handler...
        HttpResponse<String> addHandler = m1.post("/api/v1/events/" + eventA + "/assignments",
                "{\"userId\":\"%s\",\"role\":\"HANDLER\"}".formatted(member2Id));
        assertThat(addHandler.statusCode()).isEqualTo(201);
        String handlerAssignmentId = idOf(addHandler.body());
        // ...but may NOT appoint another Sub-admin (elevation is Admin-only).
        assertThat(m1.post("/api/v1/events/" + eventA + "/assignments",
                "{\"userId\":\"%s\",\"role\":\"SUB_ADMIN\"}".formatted(member2Id)).statusCode()).isEqualTo(403);
        // Duplicate assignment → 409.
        assertThat(m1.post("/api/v1/events/" + eventA + "/assignments",
                "{\"userId\":\"%s\",\"role\":\"HANDLER\"}".formatted(member2Id)).statusCode()).isEqualTo(409);

        // Handler can view but not manage.
        HttpTestClient m2 = login("m2@gatherly.test");
        assertThat(m2.get("/api/v1/events/" + eventA).statusCode()).isEqualTo(200);
        assertThat(m2.put("/api/v1/events/" + eventA, "{\"title\":\"nope\"}").statusCode()).isEqualTo(403);

        // Removing the Handler: MANAGER may; removing a MANAGER is Admin-only.
        assertThat(m1.delete("/api/v1/events/" + eventA + "/assignments/" + handlerAssignmentId).statusCode())
                .isEqualTo(204);
    }

    @Test
    void usersTableShowsAssignmentScopeAndEditableRole() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventA = idOf(admin.post("/api/v1/events", "{\"title\":\"Event A\"}").body());
        String eventB = idOf(admin.post("/api/v1/events", "{\"title\":\"Event B\"}").body());

        // member1 → assigned to two events; member2 → assigned to one (Event A).
        admin.post("/api/v1/events/" + eventA + "/assignments", "{\"userId\":\"%s\",\"role\":\"SUB_ADMIN\"}".formatted(member1Id));
        admin.post("/api/v1/events/" + eventB + "/assignments", "{\"userId\":\"%s\",\"role\":\"HANDLER\"}".formatted(member1Id));
        admin.post("/api/v1/events/" + eventA + "/assignments", "{\"userId\":\"%s\",\"role\":\"HANDLER\"}".formatted(member2Id));

        String list = admin.get("/api/v1/users?size=50").body();
        // member1: count 2, no single name. member2: count 1, name "Event A".
        assertThat(list).contains("\"assignedEventCount\":2");
        assertThat(list).contains("\"assignedEventCount\":1").contains("\"assignedEventName\":\"Event A\"");

        // Admin edit can change the event-role tier (Sub-admin ↔ Handler) via defaultEventRole.
        HttpResponse<String> toManager = admin.put("/api/v1/users/" + member2Id,
                "{\"fullName\":\"Mia\",\"globalRole\":\"MEMBER\",\"defaultEventRole\":\"MANAGER\",\"status\":\"ACTIVE\"}");
        assertThat(toManager.statusCode()).isEqualTo(200);
        assertThat(toManager.body()).contains("\"defaultEventRole\":\"MANAGER\"");

        // Promoting to ADMIN drops the event-role tier (admins have none).
        HttpResponse<String> toAdmin = admin.put("/api/v1/users/" + member2Id,
                "{\"fullName\":\"Mia\",\"globalRole\":\"ADMIN\",\"defaultEventRole\":\"MANAGER\",\"status\":\"ACTIVE\"}");
        assertThat(toAdmin.statusCode()).isEqualTo(200);
        assertThat(toAdmin.body()).contains("\"globalRole\":\"ADMIN\"").doesNotContain("\"defaultEventRole\":\"MANAGER\"");
    }

    @Test
    void unassignedMemberCannotViewEvent() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventA = idOf(admin.post("/api/v1/events", "{\"title\":\"Private\"}").body());
        HttpTestClient m1 = login("m1@gatherly.test");
        assertThat(m1.get("/api/v1/events/" + eventA).statusCode()).isEqualTo(403);
        assertThat(m1.get("/api/v1/events/" + eventA + "/assignments").statusCode()).isEqualTo(403);
    }

    private HttpTestClient login(String email) {
        HttpTestClient c = new HttpTestClient(port);
        c.post("/api/v1/auth/login", "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, PW));
        return c;
    }

    private static String idOf(String json) {
        Matcher m = ID.matcher(json);
        if (!m.find()) throw new AssertionError("No id in: " + json);
        return m.group(1);
    }

    private User save(String email, GlobalRole role) {
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(PW));
        u.setFullName("Test " + email);
        u.setGlobalRole(role);
        u.setStatus(UserStatus.ACTIVE);
        return users.save(u);
    }
}
