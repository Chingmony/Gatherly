package com.gatherly.registration;

import com.gatherly.AbstractIntegrationTest;
import com.gatherly.auth.RefreshTokenRepository;
import com.gatherly.event.EventRepository;
import com.gatherly.form.RegistrationFormRepository;
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
 * Public guest registration → QR ticket, plus the organizer "Manage Guests" gate (docs/03 §4.9,
 * §4.8, docs/07 §3). The two public routes here are the only added unauthenticated surface.
 */
class RegistrationFlowIT extends AbstractIntegrationTest {

    private static final Pattern ID = Pattern.compile("\"id\":\"([0-9a-f-]{36})\"");
    private static final Pattern TOKEN = Pattern.compile("\"checkinToken\":\"(tkt_[^\"]+)\"");

    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired EventRepository eventRepo;
    @Autowired RegistrationFormRepository forms;
    @Autowired RegistrationSubmissionRepository submissions;
    @Autowired RefreshTokenRepository refreshTokens;
    @Autowired PasswordEncoder encoder;

    private static final String PW = "Passw0rd!";
    private static final String SCHEMA = """
            {"title":"RSVP","schema":[
              {"key":"full_name","label":"Name","type":"text","required":true,"order":1},
              {"key":"email","label":"Email","type":"email","required":true,"order":2},
              {"key":"phone","label":"Phone","type":"phone","required":true,"order":3}
            ]}""";

    @BeforeEach
    void seed() {
        submissions.deleteAll();
        forms.deleteAll();
        eventRepo.deleteAll();
        refreshTokens.deleteAll();
        users.deleteAll();
        save("admin@gatherly.test", GlobalRole.ADMIN);
        save("member@gatherly.test", GlobalRole.MEMBER);
    }

    @AfterEach
    void cleanup() {
        submissions.deleteAll();
        forms.deleteAll();
        eventRepo.deleteAll();
    }

    @Test
    void guestRegistersAndGetsTicket() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventId = publishedEventWithForm(admin, null);

        HttpTestClient guest = new HttpTestClient(port); // unauthenticated

        // Public listing shows the event.
        assertThat(guest.get("/api/v1/public/events").body()).contains(eventId);

        // Register.
        HttpResponse<String> reg = guest.post("/api/v1/public/events/" + eventId + "/register",
                "{\"answers\":{\"full_name\":\"Dara Sok\",\"email\":\"dara@example.com\",\"phone\":\"+855 12 345 678\"}}");
        assertThat(reg.statusCode()).isEqualTo(201);
        assertThat(reg.body()).contains("\"ticketStatus\":\"PENDING\"").contains("tkt_");
        String token = group(TOKEN, reg.body());

        // Ticket portal resolves the token (on-screen QR fallback).
        HttpResponse<String> ticket = guest.get("/api/v1/public/tickets/" + token);
        assertThat(ticket.statusCode()).isEqualTo(200);
        assertThat(ticket.body()).contains("PENDING").contains("Dara Sok");

        // No attendance record is created by registration (that's an organizer scan, M7).
        assertThat(submissions.count()).isEqualTo(1);

        // Organizer "Manage Guests" lists the registrant.
        assertThat(admin.get("/api/v1/events/" + eventId + "/submissions").body()).contains("dara@example.com");
    }

    @Test
    void duplicateEmailAndBadAnswersRejected() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventId = publishedEventWithForm(admin, null);
        HttpTestClient guest = new HttpTestClient(port);

        String ok = "{\"answers\":{\"full_name\":\"A\",\"email\":\"dup@example.com\",\"phone\":\"+855 12 000 111\"}}";
        assertThat(guest.post("/api/v1/public/events/" + eventId + "/register", ok).statusCode()).isEqualTo(201);
        // Same email again → 409.
        assertThat(guest.post("/api/v1/public/events/" + eventId + "/register", ok).statusCode()).isEqualTo(409);

        // Missing required phone → 400 VALIDATION_ERROR with field errors.
        HttpResponse<String> bad = guest.post("/api/v1/public/events/" + eventId + "/register",
                "{\"answers\":{\"full_name\":\"B\",\"email\":\"b@example.com\"}}");
        assertThat(bad.statusCode()).isEqualTo(400);
        assertThat(bad.body()).contains("VALIDATION_ERROR").contains("\"field\":\"phone\"");
    }

    @Test
    void registrationRequiresPublicEventAndActiveForm() {
        HttpTestClient admin = login("admin@gatherly.test");
        // Draft event, no form → public register/listing must not expose it.
        String draftId = group(ID, admin.post("/api/v1/events", "{\"title\":\"Draft Only\"}").body());
        HttpTestClient guest = new HttpTestClient(port);

        HttpResponse<String> res = guest.post("/api/v1/public/events/" + draftId + "/register",
                "{\"answers\":{\"email\":\"x@x.com\",\"phone\":\"+855 12 345 678\"}}");
        assertThat(res.statusCode()).isEqualTo(404); // non-public event is not revealed
        assertThat(guest.get("/api/v1/public/events").body()).doesNotContain(draftId);
    }

    @Test
    void capacityIsEnforced() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventId = publishedEventWithForm(admin, 1); // capacity 1
        HttpTestClient guest = new HttpTestClient(port);

        assertThat(guest.post("/api/v1/public/events/" + eventId + "/register",
                "{\"answers\":{\"full_name\":\"One\",\"email\":\"one@x.com\",\"phone\":\"+855 12 000 001\"}}")
                .statusCode()).isEqualTo(201);
        // Second distinct guest exceeds capacity.
        assertThat(guest.post("/api/v1/public/events/" + eventId + "/register",
                "{\"answers\":{\"full_name\":\"Two\",\"email\":\"two@x.com\",\"phone\":\"+855 12 000 002\"}}")
                .statusCode()).isEqualTo(409);
    }

    @Test
    void manageGuestsIsGated() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventId = publishedEventWithForm(admin, null);
        // Unassigned member → 403; unauthenticated → 401.
        assertThat(login("member@gatherly.test").get("/api/v1/events/" + eventId + "/submissions").statusCode())
                .isEqualTo(403);
        assertThat(new HttpTestClient(port).get("/api/v1/events/" + eventId + "/submissions").statusCode())
                .isEqualTo(401);
    }

    /** Create an event (optional capacity), build + activate its form, and publish it. */
    private String publishedEventWithForm(HttpTestClient admin, Integer capacity) {
        String createBody = capacity == null
                ? "{\"title\":\"Public Conf\"}"
                : "{\"title\":\"Capped Conf\",\"capacity\":" + capacity + "}";
        String eventId = group(ID, admin.post("/api/v1/events", createBody).body());
        admin.put("/api/v1/events/" + eventId + "/form", SCHEMA);
        admin.post("/api/v1/events/" + eventId + "/form/activate", "");
        admin.post("/api/v1/events/" + eventId + "/publish", "");
        return eventId;
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
