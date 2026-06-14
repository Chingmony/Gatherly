package com.gatherly.form;

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
 * Registration form builder + activation guard + public exposure (docs/03 §4.8/§4.9, docs/02 §6.1).
 */
class FormFlowIT extends AbstractIntegrationTest {

    private static final Pattern ID = Pattern.compile("\"id\":\"([0-9a-f-]{36})\"");
    private static final Pattern SLUG = Pattern.compile("\"slug\":\"([^\"]+)\"");

    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired EventRepository eventRepo;
    @Autowired RegistrationFormRepository forms;
    @Autowired RefreshTokenRepository refreshTokens;
    @Autowired PasswordEncoder encoder;

    private static final String PW = "Passw0rd!";

    private static final String VALID_SCHEMA = """
            {"title":"RSVP","schema":[
              {"key":"full_name","label":"Name","type":"text","required":true,"order":1},
              {"key":"email","label":"Email","type":"email","required":true,"order":2},
              {"key":"phone","label":"Phone","type":"phone","required":true,"order":3}
            ]}""";

    @BeforeEach
    void seed() {
        forms.deleteAll();
        eventRepo.deleteAll();
        refreshTokens.deleteAll();
        users.deleteAll();
        save("admin@gatherly.test", GlobalRole.ADMIN);
        save("member@gatherly.test", GlobalRole.MEMBER);
    }

    @AfterEach
    void cleanup() {
        forms.deleteAll();
        eventRepo.deleteAll();
    }

    @Test
    void buildActivateAndExposePublicly() {
        HttpTestClient admin = login("admin@gatherly.test");
        String body = admin.post("/api/v1/events", "{\"title\":\"Public Conf\"}").body();
        String eventId = group(ID, body);
        String slug = group(SLUG, body);

        // Build the form.
        assertThat(admin.put("/api/v1/events/" + eventId + "/form", VALID_SCHEMA).statusCode()).isEqualTo(200);
        HttpResponse<String> get = admin.get("/api/v1/events/" + eventId + "/form");
        assertThat(get.statusCode()).isEqualTo(200);
        assertThat(get.body()).contains("\"status\":\"DRAFT\"").contains("\"type\":\"email\"");

        // Public access denied while event is DRAFT.
        assertThat(new HttpTestClient(port).get("/api/v1/public/events/" + slug + "/form").statusCode()).isEqualTo(404);

        // Activate + publish, then the public form resolves.
        assertThat(admin.post("/api/v1/events/" + eventId + "/form/activate", "").statusCode()).isEqualTo(200);
        assertThat(admin.post("/api/v1/events/" + eventId + "/publish", "").statusCode()).isEqualTo(200);
        HttpResponse<String> pub = new HttpTestClient(port).get("/api/v1/public/events/" + slug + "/form");
        assertThat(pub.statusCode()).isEqualTo(200);
        assertThat(pub.body()).contains("Public Conf").contains("\"type\":\"phone\"");

        // Editing a locked (ACTIVE) form is rejected.
        assertThat(admin.put("/api/v1/events/" + eventId + "/form", VALID_SCHEMA).statusCode()).isEqualTo(409);
    }

    @Test
    void activationRequiresEmailAndPhone() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventId = group(ID, admin.post("/api/v1/events", "{\"title\":\"No Phone\"}").body());
        // Schema missing a required phone field.
        admin.put("/api/v1/events/" + eventId + "/form", """
                {"title":"Bad","schema":[
                  {"key":"email","label":"Email","type":"email","required":true,"order":1}
                ]}""");
        HttpResponse<String> res = admin.post("/api/v1/events/" + eventId + "/form/activate", "");
        assertThat(res.statusCode()).isEqualTo(400);
        assertThat(res.body()).contains("VALIDATION_ERROR");
    }

    @Test
    void memberCannotBuildForm() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventId = group(ID, admin.post("/api/v1/events", "{\"title\":\"Locked\"}").body());
        HttpTestClient member = login("member@gatherly.test");
        assertThat(member.put("/api/v1/events/" + eventId + "/form", VALID_SCHEMA).statusCode()).isEqualTo(403);
        assertThat(member.get("/api/v1/events/" + eventId + "/form").statusCode()).isEqualTo(403);
    }

    private HttpTestClient login(String email) {
        HttpTestClient c = new HttpTestClient(port);
        c.post("/api/v1/auth/login", "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, PW));
        return c;
    }

    private static String group(Pattern p, String s) {
        Matcher m = p.matcher(s);
        if (!m.find()) throw new AssertionError("No match for " + p + " in " + s);
        return m.group(1);
    }

    private void save(String email, GlobalRole role) {
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(PW));
        u.setFullName("Test " + email);
        u.setGlobalRole(role);
        u.setStatus(UserStatus.ACTIVE);
        users.save(u);
    }
}
