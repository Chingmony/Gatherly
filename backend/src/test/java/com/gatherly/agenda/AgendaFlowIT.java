package com.gatherly.agenda;

import com.gatherly.AbstractIntegrationTest;
import com.gatherly.auth.RefreshTokenRepository;
import com.gatherly.event.EventRepository;
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
 * Agenda authorization + replace/template flow (docs/03 §4.4, docs/02 §3.8). Exercises the JSONB
 * template mapping and the full-replace edit end to end over real HTTP.
 */
class AgendaFlowIT extends AbstractIntegrationTest {

    private static final Pattern ID = Pattern.compile("\"id\":\"([0-9a-f-]{36})\"");

    @LocalServerPort
    int port;
    @Autowired
    UserRepository users;
    @Autowired
    EventRepository eventRepo;
    @Autowired
    AgendaItemRepository agendaItems;
    @Autowired
    RefreshTokenRepository refreshTokens;
    @Autowired
    PasswordEncoder encoder;

    private static final String ADMIN_PW = "Admin123!";
    private static final String MEMBER_PW = "Member123!";

    @BeforeEach
    void seed() {
        agendaItems.deleteAll();
        eventRepo.deleteAll();
        refreshTokens.deleteAll();
        users.deleteAll();
        save("admin@gatherly.test", ADMIN_PW, GlobalRole.ADMIN);
        save("member@gatherly.test", MEMBER_PW, GlobalRole.MEMBER);
    }

    @AfterEach
    void cleanup() {
        agendaItems.deleteAll();
        eventRepo.deleteAll();
    }

    @Test
    void templatesAreReadableAndParsed() {
        HttpTestClient member = client("member@gatherly.test", MEMBER_PW); // any authenticated user
        HttpResponse<String> res = member.get("/api/v1/agenda-templates");
        assertThat(res.statusCode()).isEqualTo(200);
        // JSONB items are returned parsed (an array of objects), not as an escaped string.
        assertThat(res.body())
                .contains("Standard Conference")
                .contains("\"items\":[{")
                .contains("Opening Keynote");
    }

    @Test
    void adminReplacesAndReadsAgenda() {
        HttpTestClient admin = client("admin@gatherly.test", ADMIN_PW);
        String eventId = idOf(admin.post("/api/v1/events", "{\"title\":\"Conf\"}").body());

        HttpResponse<String> put = admin.put("/api/v1/events/" + eventId + "/agenda", """
                {"items":[
                  {"title":"Welcome","startsAt":"2026-09-01T09:00:00Z","endsAt":"2026-09-01T09:30:00Z"},
                  {"title":"Keynote","startsAt":"2026-09-01T09:30:00Z","endsAt":"2026-09-01T10:15:00Z"}
                ]}""");
        assertThat(put.statusCode()).isEqualTo(200);
        assertThat(put.body()).contains("Welcome").contains("Keynote").contains("\"position\":0").contains("\"position\":1");

        HttpResponse<String> get = admin.get("/api/v1/events/" + eventId + "/agenda");
        assertThat(get.statusCode()).isEqualTo(200);
        assertThat(get.body().indexOf("Welcome")).isLessThan(get.body().indexOf("Keynote"));

        // Replace is total: a one-item update drops the rest.
        admin.put("/api/v1/events/" + eventId + "/agenda", "{\"items\":[{\"title\":\"Only Item\"}]}");
        HttpResponse<String> after = admin.get("/api/v1/events/" + eventId + "/agenda");
        assertThat(after.body()).contains("Only Item").doesNotContain("Keynote");
    }

    @Test
    void memberCannotViewOrEditEventAgenda() {
        HttpTestClient admin = client("admin@gatherly.test", ADMIN_PW);
        String eventId = idOf(admin.post("/api/v1/events", "{\"title\":\"Locked\"}").body());

        HttpTestClient member = client("member@gatherly.test", MEMBER_PW);
        assertThat(member.get("/api/v1/events/" + eventId + "/agenda").statusCode()).isEqualTo(403);
        assertThat(member.put("/api/v1/events/" + eventId + "/agenda",
                "{\"items\":[{\"title\":\"x\"}]}").statusCode()).isEqualTo(403);
    }

    @Test
    void unknownEventAgendaIsNotFound() {
        HttpTestClient admin = client("admin@gatherly.test", ADMIN_PW);
        assertThat(admin.get("/api/v1/events/00000000-0000-0000-0000-0000000000aa/agenda")
                .statusCode()).isEqualTo(404);
    }

    @Test
    void unauthenticatedIsRejected() {
        assertThat(new HttpTestClient(port).get("/api/v1/agenda-templates").statusCode()).isEqualTo(401);
    }

    private HttpTestClient client(String email, String pw) {
        HttpTestClient c = new HttpTestClient(port);
        c.post("/api/v1/auth/login", "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, pw));
        return c;
    }

    private static String idOf(String json) {
        Matcher m = ID.matcher(json);
        if (!m.find()) {
            throw new AssertionError("No id in response: " + json);
        }
        return m.group(1);
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
