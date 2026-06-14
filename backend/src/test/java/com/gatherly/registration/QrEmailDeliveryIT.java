package com.gatherly.registration;

import com.gatherly.AbstractIntegrationTest;
import com.gatherly.auth.RefreshTokenRepository;
import com.gatherly.event.EventRepository;
import com.gatherly.form.RegistrationFormRepository;
import com.gatherly.registration.domain.RegistrationSubmission;
import com.gatherly.registration.domain.TicketStatus;
import com.gatherly.support.HttpTestClient;
import com.gatherly.user.UserRepository;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.User;
import com.gatherly.user.domain.UserStatus;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * QR-ticket email delivery (docs/04 §2.1, docs/06 §6) validated against an in-memory GreenMail SMTP
 * (CLAUDE.md test matrix). Registration must email the guest their QR and flip {@code qr_status
 * PENDING → DELIVERED}; the resend endpoint must dispatch a second copy.
 */
class QrEmailDeliveryIT extends AbstractIntegrationTest {

    @RegisterExtension
    static final GreenMailExtension MAIL = new GreenMailExtension(ServerSetupTest.SMTP);

    @DynamicPropertySource
    static void mailProps(DynamicPropertyRegistry registry) {
        registry.add("spring.mail.host", () -> "127.0.0.1");
        registry.add("spring.mail.port", () -> ServerSetupTest.SMTP.getPort());
        registry.add("gatherly.email.enabled", () -> true);
    }

    private static final Pattern ID = Pattern.compile("\"id\":\"([0-9a-f-]{36})\"");
    private static final Pattern TOKEN = Pattern.compile("\"checkinToken\":\"(tkt_[^\"]+)\"");
    private static final String PW = "Passw0rd!";
    private static final String SCHEMA = """
            {"title":"RSVP","schema":[
              {"key":"full_name","label":"Name","type":"text","required":true,"order":1},
              {"key":"email","label":"Email","type":"email","required":true,"order":2},
              {"key":"phone","label":"Phone","type":"phone","required":true,"order":3}
            ]}""";

    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired EventRepository eventRepo;
    @Autowired RegistrationFormRepository forms;
    @Autowired RegistrationSubmissionRepository submissions;
    @Autowired RefreshTokenRepository refreshTokens;
    @Autowired PasswordEncoder encoder;

    @BeforeEach
    void seed() {
        submissions.deleteAll();
        forms.deleteAll();
        eventRepo.deleteAll();
        refreshTokens.deleteAll();
        users.deleteAll();
        User u = new User();
        u.setEmail("admin@gatherly.test");
        u.setPasswordHash(encoder.encode(PW));
        u.setFullName("Admin");
        u.setGlobalRole(GlobalRole.ADMIN);
        u.setStatus(UserStatus.ACTIVE);
        users.save(u);
    }

    @AfterEach
    void cleanup() {
        submissions.deleteAll();
        forms.deleteAll();
        eventRepo.deleteAll();
    }

    @Test
    void registrationEmailsQrTicketAndMarksDelivered() throws Exception {
        HttpTestClient admin = login();
        String eventId = group(ID, admin.post("/api/v1/events", "{\"title\":\"Public Conf\"}").body());
        admin.put("/api/v1/events/" + eventId + "/form", SCHEMA);
        admin.post("/api/v1/events/" + eventId + "/form/activate", "");
        admin.post("/api/v1/events/" + eventId + "/publish", "");

        HttpTestClient guest = new HttpTestClient(port);
        HttpResponse<String> reg = guest.post("/api/v1/public/events/" + eventId + "/register",
                "{\"answers\":{\"full_name\":\"Dara Sok\",\"email\":\"dara@example.com\",\"phone\":\"+855 12 345 678\"}}");
        assertThat(reg.statusCode()).isEqualTo(201);
        String token = group(TOKEN, reg.body());

        // The QR ticket was emailed to the address the guest registered with.
        assertThat(MAIL.waitForIncomingEmail(5000, 1)).isTrue();
        MimeMessage[] received = MAIL.getReceivedMessages();
        assertThat(received).hasSize(1);
        assertThat(received[0].getSubject()).contains("QR ticket");
        assertThat(received[0].getAllRecipients()[0].toString()).contains("dara@example.com");

        // ...and the ticket lifecycle advanced PENDING → DELIVERED.
        RegistrationSubmission sub = submissions.findByCheckinToken(token).orElseThrow();
        assertThat(sub.getQrStatus()).isEqualTo(TicketStatus.DELIVERED);
        assertThat(sub.getQrDeliveredAt()).isNotNull();

        // Resend dispatches a second copy (202, internals not surfaced).
        assertThat(guest.post("/api/v1/public/tickets/" + token + "/resend", "").statusCode()).isEqualTo(202);
        assertThat(MAIL.waitForIncomingEmail(5000, 2)).isTrue();
        assertThat(MAIL.getReceivedMessages().length).isGreaterThanOrEqualTo(2);
    }

    private HttpTestClient login() {
        HttpTestClient c = new HttpTestClient(port);
        c.post("/api/v1/auth/login", "{\"email\":\"admin@gatherly.test\",\"password\":\"" + PW + "\"}");
        return c;
    }

    private static String group(Pattern p, String s) {
        Matcher m = p.matcher(s);
        if (!m.find()) throw new AssertionError("No match for " + p + " in " + s);
        return m.group(1);
    }
}
