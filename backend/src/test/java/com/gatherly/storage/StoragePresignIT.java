package com.gatherly.storage;

import com.gatherly.AbstractIntegrationTest;
import com.gatherly.auth.RefreshTokenRepository;
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
 * Presign authorization + validation matrix (docs/04 §4.4): org assets require Admin; avatars are
 * self-scoped; content type + size are validated before a URL is signed. Presigning is offline, so
 * no live Rustfs cluster is required.
 */
class StoragePresignIT extends AbstractIntegrationTest {

    @LocalServerPort
    int port;
    @Autowired
    UserRepository users;
    @Autowired
    RefreshTokenRepository refreshTokens;
    @Autowired
    PasswordEncoder encoder;

    private static final String ADMIN_PW = "Admin123!";
    private static final String MEMBER_PW = "Member123!";

    @BeforeEach
    void seed() {
        refreshTokens.deleteAll();
        users.deleteAll();
        save("admin@gatherly.test", ADMIN_PW, GlobalRole.ADMIN);
        save("member@gatherly.test", MEMBER_PW, GlobalRole.MEMBER);
    }

    @Test
    void adminCanPresignOrgLogo() {
        HttpTestClient admin = client("admin@gatherly.test", ADMIN_PW);
        HttpResponse<String> res = admin.post("/api/v1/storage/presign",
                "{\"purpose\":\"ORG_LOGO\",\"contentType\":\"image/png\",\"sizeBytes\":2048}");
        assertThat(res.statusCode()).isEqualTo(200);
        assertThat(res.body())
                .contains("\"uploadUrl\"")
                .contains("\"objectKey\":\"org/logo/");
    }

    @Test
    void memberCannotPresignOrgAssets() {
        HttpTestClient member = client("member@gatherly.test", MEMBER_PW);
        HttpResponse<String> res = member.post("/api/v1/storage/presign",
                "{\"purpose\":\"ORG_BANNER\",\"contentType\":\"image/png\",\"sizeBytes\":2048}");
        assertThat(res.statusCode()).isEqualTo(403);
        assertThat(res.body()).contains("FORBIDDEN");
    }

    @Test
    void memberCanPresignOwnAvatar() {
        HttpTestClient member = client("member@gatherly.test", MEMBER_PW);
        HttpResponse<String> res = member.post("/api/v1/storage/presign",
                "{\"purpose\":\"USER_AVATAR\",\"contentType\":\"image/jpeg\",\"sizeBytes\":4096}");
        assertThat(res.statusCode()).isEqualTo(200);
        assertThat(res.body()).contains("/avatar/");
    }

    @Test
    void unsupportedContentTypeIsRejected() {
        HttpTestClient admin = client("admin@gatherly.test", ADMIN_PW);
        HttpResponse<String> res = admin.post("/api/v1/storage/presign",
                "{\"purpose\":\"ORG_LOGO\",\"contentType\":\"application/pdf\",\"sizeBytes\":2048}");
        assertThat(res.statusCode()).isEqualTo(400);
        assertThat(res.body()).contains("VALIDATION_ERROR");
    }

    @Test
    void unauthenticatedIsRejected() {
        HttpResponse<String> res = new HttpTestClient(port).post("/api/v1/storage/presign",
                "{\"purpose\":\"USER_AVATAR\",\"contentType\":\"image/png\",\"sizeBytes\":1024}");
        assertThat(res.statusCode()).isEqualTo(401);
    }

    private HttpTestClient client(String email, String pw) {
        HttpTestClient c = new HttpTestClient(port);
        c.post("/api/v1/auth/login", "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, pw));
        return c;
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
