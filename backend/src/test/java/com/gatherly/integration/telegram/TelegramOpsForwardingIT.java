package com.gatherly.integration.telegram;

import com.gatherly.AbstractIntegrationTest;
import com.gatherly.attendance.EventCheckinRepository;
import com.gatherly.auth.RefreshTokenRepository;
import com.gatherly.event.EventRepository;
import com.gatherly.form.RegistrationFormRepository;
import com.gatherly.registration.RegistrationSubmissionRepository;
import com.gatherly.support.HttpTestClient;
import com.gatherly.user.UserRepository;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.User;
import com.gatherly.user.domain.UserStatus;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Telegram ops-channel forwarding (docs/04 §2.2, docs/06 §6–7). A JDK {@link HttpServer} stands in
 * for the Bot API (no real network call): the after-commit push fires on registration + scan and
 * flips {@code telegram_notified}. Also asserts the disabled-by-default behaviour is exercised by the
 * other ITs (here the stub is enabled via {@link DynamicPropertySource}).
 */
class TelegramOpsForwardingIT extends AbstractIntegrationTest {

    private static final Pattern ID = Pattern.compile("\"id\":\"([0-9a-f-]{36})\"");
    private static final Pattern TOKEN = Pattern.compile("\"checkinToken\":\"(tkt_[^\"]+)\"");
    private static final String PW = "Passw0rd!";
    private static final String CHAT_ID = "-1001234567890";
    private static final String SCHEMA = """
            {"title":"RSVP","schema":[
              {"key":"full_name","label":"Name","type":"text","required":true,"order":1},
              {"key":"email","label":"Email","type":"email","required":true,"order":2},
              {"key":"phone","label":"Phone","type":"phone","required":true,"order":3}
            ]}""";

    /** Records every sendMessage body the bot posts, so tests can assert on the ops messages. */
    private static final List<String> SENT = new CopyOnWriteArrayList<>();
    private static final HttpServer STUB;

    static {
        try {
            STUB = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        } catch (IOException e) {
            throw new ExceptionInInitializerError(e);
        }
        STUB.createContext("/", exchange -> {
            try (InputStream in = exchange.getRequestBody()) {
                SENT.add(new String(in.readAllBytes(), StandardCharsets.UTF_8));
            }
            byte[] ok = "{\"ok\":true}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, ok.length);
            try (OutputStream out = exchange.getResponseBody()) {
                out.write(ok);
            }
        });
        STUB.start();
    }

    @DynamicPropertySource
    static void telegramProps(DynamicPropertyRegistry registry) {
        registry.add("gatherly.telegram.enabled", () -> true);
        registry.add("gatherly.telegram.bot-token", () -> "test-token");
        registry.add("gatherly.telegram.ops-chat-id", () -> CHAT_ID);
        registry.add("gatherly.telegram.api-base", () -> "http://127.0.0.1:" + STUB.getAddress().getPort());
    }

    @LocalServerPort int port;
    @Autowired UserRepository users;
    @Autowired EventRepository eventRepo;
    @Autowired RegistrationFormRepository forms;
    @Autowired RegistrationSubmissionRepository submissions;
    @Autowired EventCheckinRepository checkins;
    @Autowired RefreshTokenRepository refreshTokens;
    @Autowired PasswordEncoder encoder;

    private String lastEventId;

    @BeforeEach
    void seed() {
        clean();
        SENT.clear();
        User u = new User();
        u.setEmail("admin@gatherly.test");
        u.setPasswordHash(encoder.encode(PW));
        u.setFullName("Ada Admin");
        u.setGlobalRole(GlobalRole.ADMIN);
        u.setStatus(UserStatus.ACTIVE);
        users.save(u);
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
    void registrationAndCheckinAreForwardedToOpsChannel() {
        HttpTestClient admin = login("admin@gatherly.test");
        String eventId = publishedEventWithForm(admin);
        String token = registerGuest("dara@example.com");

        // Registration fired an after-commit "Registered" push and flipped the flag.
        await(() -> SENT.stream().anyMatch(b -> b.contains("Registered") && b.contains("Dara Sok")));
        assertThat(submissions.findAll()).allMatch(RegistrationSubmissionTelegram::notified);
        assertThat(SENT).anyMatch(b -> b.contains(CHAT_ID)); // posted to the configured ops channel

        SENT.clear();

        // Scan → after-commit "Checked in" push; event_checkin.telegram_notified flips true.
        HttpResponse<String> scan = admin.post("/api/v1/events/" + eventId + "/attendance/scan",
                "{\"checkinToken\":\"" + token + "\"}");
        assertThat(scan.statusCode()).isEqualTo(201);

        await(() -> SENT.stream().anyMatch(b -> b.contains("Checked in") && b.contains("Dara Sok")
                && b.contains("Ada Admin"))); // 🙋 by the scanning organizer
        assertThat(checkins.findAll()).isNotEmpty().allMatch(c -> c.isTelegramNotified());
    }

    // ---- helpers -------------------------------------------------------------

    private String registerGuest(String email) {
        HttpResponse<String> reg = new HttpTestClient(port).post(
                "/api/v1/public/events/" + lastEventId + "/register",
                "{\"answers\":{\"full_name\":\"Dara Sok\",\"email\":\"" + email
                        + "\",\"phone\":\"+855 12 345 678\"}}");
        assertThat(reg.statusCode()).isEqualTo(201);
        return group(TOKEN, reg.body());
    }

    private String publishedEventWithForm(HttpTestClient admin) {
        String eventId = group(ID, admin.post("/api/v1/events", "{\"title\":\"Public Conf\"}").body());
        admin.put("/api/v1/events/" + eventId + "/form", SCHEMA);
        admin.post("/api/v1/events/" + eventId + "/form/activate", "");
        admin.post("/api/v1/events/" + eventId + "/publish", "");
        lastEventId = eventId;
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

    /** AFTER_COMMIT pushes are synchronous, but poll briefly to stay robust against scheduling. */
    private static void await(java.util.function.BooleanSupplier cond) {
        for (int i = 0; i < 50; i++) {
            if (cond.getAsBoolean()) return;
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        throw new AssertionError("Condition not met within timeout. Sent messages: " + SENT);
    }

    /** Tiny adapter so the {@code allMatch} reads cleanly. */
    private interface RegistrationSubmissionTelegram {
        static boolean notified(com.gatherly.registration.domain.RegistrationSubmission s) {
            return s.isTelegramNotified();
        }
    }
}
