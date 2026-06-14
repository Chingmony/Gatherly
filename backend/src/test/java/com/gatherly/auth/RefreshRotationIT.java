package com.gatherly.auth;

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

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Refresh-token rotation + reuse detection (docs/03 §2.3): rotating issues a new pair, and
 * replaying a revoked (already-rotated) token revokes the entire chain.
 */
class RefreshRotationIT extends AbstractIntegrationTest {

    @LocalServerPort
    int port;
    @Autowired
    UserRepository users;
    @Autowired
    RefreshTokenRepository refreshTokens;
    @Autowired
    PasswordEncoder encoder;

    @BeforeEach
    void seed() {
        refreshTokens.deleteAll();
        users.deleteAll();
        User u = new User();
        u.setEmail("admin@gatherly.test");
        u.setPasswordHash(encoder.encode("Admin123!"));
        u.setFullName("Admin");
        u.setGlobalRole(GlobalRole.ADMIN);
        u.setStatus(UserStatus.ACTIVE);
        users.save(u);
    }

    @Test
    void rotationIssuesNewPairAndReuseRevokesChain() {
        HttpTestClient c = new HttpTestClient(port);
        c.post("/api/v1/auth/login", "{\"email\":\"admin@gatherly.test\",\"password\":\"Admin123!\"}");

        String firstRefresh = cookieValue(c, "refresh_token");
        assertThat(firstRefresh).isNotBlank();

        // Rotate once with the live client → new pair issued.
        assertThat(c.post("/api/v1/auth/refresh", "").statusCode()).isEqualTo(200);

        // Replay the original (now-revoked) refresh token → reuse detected → 401.
        HttpResponse<String> reuse = rawRefresh(firstRefresh);
        assertThat(reuse.statusCode()).isEqualTo(401);

        // The whole chain is revoked, so the client's current (rotated) token is dead too.
        assertThat(c.post("/api/v1/auth/refresh", "").statusCode()).isEqualTo(401);
    }

    private String cookieValue(HttpTestClient c, String name) {
        return c.cookies().getCookieStore().getCookies().stream()
                .filter(ck -> name.equals(ck.getName()))
                .map(java.net.HttpCookie::getValue)
                .findFirst().orElse(null);
    }

    private HttpResponse<String> rawRefresh(String refreshToken) {
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/v1/auth/refresh"))
                    .header("Cookie", "refresh_token=" + refreshToken)
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();
            return HttpClient.newHttpClient().send(req, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
