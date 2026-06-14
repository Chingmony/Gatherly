package com.gatherly.auth;

import com.gatherly.AbstractIntegrationTest;
import com.gatherly.event.domain.EventRole;
import com.gatherly.support.HttpTestClient;
import com.gatherly.user.UserRepository;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.User;
import com.gatherly.user.domain.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.net.http.HttpResponse;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Account activation via the set-password flow (docs/06 §3a): a PENDING_ACTIVATION user sets a
 * password with a single-use token, becomes ACTIVE, and can then log in. Bad/used tokens fail.
 */
class ActivationFlowIT extends AbstractIntegrationTest {

    @LocalServerPort
    int port;
    @Autowired
    UserRepository users;
    @Autowired
    ActivationService activation;

    private UUID pendingUserId;

    @BeforeEach
    void seedPendingUser() {
        users.deleteAll();
        User u = new User();
        u.setEmail("invitee@gatherly.test");
        u.setFullName("Invitee");
        u.setGlobalRole(GlobalRole.MEMBER);
        u.setDefaultEventRole(EventRole.HANDLER);
        u.setStatus(UserStatus.PENDING_ACTIVATION); // no password yet
        pendingUserId = users.save(u).getId();
    }

    @Test
    void setPasswordActivatesAccountAndEnablesLogin() {
        String token = activation.mint(pendingUserId);
        HttpTestClient c = new HttpTestClient(port);

        HttpResponse<String> set = c.post("/api/v1/auth/set-password",
                "{\"token\":\"%s\",\"newPassword\":\"Activate123!\"}".formatted(token));
        assertThat(set.statusCode()).isEqualTo(204);
        assertThat(users.findById(pendingUserId).orElseThrow().getStatus()).isEqualTo(UserStatus.ACTIVE);

        HttpResponse<String> login = c.post("/api/v1/auth/login",
                "{\"email\":\"invitee@gatherly.test\",\"password\":\"Activate123!\"}");
        assertThat(login.statusCode()).isEqualTo(200);
    }

    @Test
    void tokenIsSingleUse() {
        String token = activation.mint(pendingUserId);
        HttpTestClient c = new HttpTestClient(port);
        String body = "{\"token\":\"%s\",\"newPassword\":\"Activate123!\"}".formatted(token);

        assertThat(c.post("/api/v1/auth/set-password", body).statusCode()).isEqualTo(204);
        // Reuse → token consumed (and account no longer pending) → ACTIVATION_INVALID.
        HttpResponse<String> reuse = c.post("/api/v1/auth/set-password", body);
        assertThat(reuse.statusCode()).isEqualTo(409);
        assertThat(reuse.body()).contains("ACTIVATION_INVALID");
    }

    @Test
    void invalidTokenIsRejected() {
        HttpResponse<String> res = new HttpTestClient(port).post("/api/v1/auth/set-password",
                "{\"token\":\"not-a-real-token\",\"newPassword\":\"Activate123!\"}");
        assertThat(res.statusCode()).isEqualTo(409);
        assertThat(res.body()).contains("ACTIVATION_INVALID");
    }
}
