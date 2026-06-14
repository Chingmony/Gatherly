package com.gatherly.attendance;

import com.gatherly.AbstractIntegrationTest;
import com.gatherly.auth.RefreshTokenRepository;
import com.gatherly.event.EventRepository;
import com.gatherly.form.RegistrationFormRepository;
import com.gatherly.registration.RegistrationSubmissionRepository;
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
 * Organizer attendance scan (docs/03 §4.10, docs/06 §4, docs/09 §2.3). Exercises the idempotent
 * check-in, the authorization matrix (assigned staff scan; unassigned 403; cross-event 404), revoke,
 * and the live attendance read.
 */
class AttendanceFlowIT extends AbstractIntegrationTest {

    private static final Pattern ID = Pattern.compile("\"id\":\"([0-9a-f-]{36})\"");
    private static final Pattern SUBMISSION = Pattern.compile("\"submissionId\":\"([0-9a-f-]{36})\"");
    private static final Pattern TOKEN = Pattern.compile("\"checkinToken\":\"(tkt_[^\"]+)\"");

    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired EventRepository eventRepo;
    @Autowired RegistrationFormRepository forms;
    @Autowired RegistrationSubmissionRepository submissions;
    @Autowired EventCheckinRepository checkins;
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
        clean();
        save("admin@gatherly.test", GlobalRole.ADMIN);
        save("member@gatherly.test", GlobalRole.MEMBER);
    }

    @AfterEach
    void cleanup() {
        clean();
    }

    private void clean() {
        checkins.deleteAll();
        submissions.deleteAll();
        forms.deleteAll();
        eventRepo.deleteAll();
        refreshTokens.deleteAll();
        users.deleteAll();
    }

    @Test
    void scanConfirmsAttendanceAndIsIdempotent() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventId = publishedEventWithForm(admin, null);
        String token = registerGuest("dara@example.com");

        // First scan → 201 CHECKED_IN.
        HttpResponse<String> first = admin.post("/api/v1/events/" + eventId + "/attendance/scan",
                "{\"checkinToken\":\"" + token + "\"}");
        assertThat(first.statusCode()).isEqualTo(201);
        assertThat(first.body()).contains("\"ticketStatus\":\"CHECKED_IN\"").contains("Dara");

        // Re-scan → 409 ALREADY_CHECKED_IN (idempotent via UNIQUE(submission_id)).
        HttpResponse<String> again = admin.post("/api/v1/events/" + eventId + "/attendance/scan",
                "{\"checkinToken\":\"" + token + "\"}");
        assertThat(again.statusCode()).isEqualTo(409);
        assertThat(again.body()).contains("ALREADY_CHECKED_IN");

        // Exactly one attendance row exists.
        assertThat(checkins.count()).isEqualTo(1);

        // Live attendance reflects the check-in.
        HttpResponse<String> live = admin.get("/api/v1/events/" + eventId + "/attendance");
        assertThat(live.statusCode()).isEqualTo(200);
        assertThat(live.body()).contains("\"checkedInCount\":1").contains("\"registeredCount\":1");
    }

    @Test
    void revokedTicketCannotBeScanned() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventId = publishedEventWithForm(admin, null);
        Registration reg = registerGuestFull("revoke@example.com");

        // Manager revokes the ticket → later scan rejected with TICKET_INVALID.
        assertThat(admin.post("/api/v1/events/" + eventId + "/tickets/" + reg.submissionId() + "/revoke", "")
                .statusCode()).isEqualTo(204);
        HttpResponse<String> scan = admin.post("/api/v1/events/" + eventId + "/attendance/scan",
                "{\"checkinToken\":\"" + reg.token() + "\"}");
        assertThat(scan.statusCode()).isEqualTo(409);
        assertThat(scan.body()).contains("TICKET_INVALID");
    }

    @Test
    void manualOverrideChecksInWithoutQr() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventId = publishedEventWithForm(admin, null);
        Registration reg = registerGuestFull("manual@example.com");

        HttpResponse<String> manual = admin.post("/api/v1/events/" + eventId + "/attendance/manual",
                "{\"submissionId\":\"" + reg.submissionId() + "\"}");
        assertThat(manual.statusCode()).isEqualTo(201);
        assertThat(manual.body()).contains("\"source\":\"MANUAL\"").contains("\"ticketStatus\":\"CHECKED_IN\"");
    }

    @Test
    void crossEventTokenIsNotFound() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventA = publishedEventWithForm(admin, null);
        String eventB = publishedEventWithForm(admin, null);
        String tokenB = registerGuest("b@example.com"); // registered on event B

        // Scanning B's token against event A must 404 (no cross-event existence leak).
        HttpResponse<String> scan = admin.post("/api/v1/events/" + eventA + "/attendance/scan",
                "{\"checkinToken\":\"" + tokenB + "\"}");
        assertThat(scan.statusCode()).isEqualTo(404);
        assertThat(eventB).isNotEqualTo(eventA);
    }

    @Test
    void scanIsGatedToAssignedStaff() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventId = publishedEventWithForm(admin, null);
        String token = registerGuest("gate@example.com");
        String body = "{\"checkinToken\":\"" + token + "\"}";

        // Unassigned member → 403; unauthenticated → 401.
        assertThat(login("member@gatherly.test").post("/api/v1/events/" + eventId + "/attendance/scan", body)
                .statusCode()).isEqualTo(403);
        assertThat(new HttpTestClient(port).post("/api/v1/events/" + eventId + "/attendance/scan", body)
                .statusCode()).isEqualTo(401);
    }

    // ---- helpers -------------------------------------------------------------

    private record Registration(String token, String submissionId) {
    }

    /** Register a guest on {@code lastEventId} and return the ticket token. */
    private String registerGuest(String email) {
        return registerGuestFull(email).token();
    }

    /** Register a guest on {@code lastEventId} and return both the token and submission id. */
    private Registration registerGuestFull(String email) {
        HttpResponse<String> reg = new HttpTestClient(port).post(
                "/api/v1/public/events/" + lastEventId + "/register",
                "{\"answers\":{\"full_name\":\"Dara Sok\",\"email\":\"" + email
                        + "\",\"phone\":\"+855 12 345 678\"}}");
        assertThat(reg.statusCode()).isEqualTo(201);
        return new Registration(group(TOKEN, reg.body()), group(SUBMISSION, reg.body()));
    }

    private String publishedEventWithForm(HttpTestClient admin, Integer capacity) {
        String createBody = capacity == null
                ? "{\"title\":\"Public Conf\"}"
                : "{\"title\":\"Capped Conf\",\"capacity\":" + capacity + "}";
        String eventId = group(ID, admin.post("/api/v1/events", createBody).body());
        admin.put("/api/v1/events/" + eventId + "/form", SCHEMA);
        admin.post("/api/v1/events/" + eventId + "/form/activate", "");
        admin.post("/api/v1/events/" + eventId + "/publish", "");
        lastEventId = eventId;
        return eventId;
    }

    private String lastEventId;

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
