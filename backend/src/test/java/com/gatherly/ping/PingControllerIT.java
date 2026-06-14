package com.gatherly.ping;

import com.gatherly.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@code GET /api/v1/ping} is public (docs/03 §2.2) and returns the liveness payload — the
 * backend half of the M0 end-to-end demo. Driven over real HTTP (random port) so the security
 * filter chain is genuinely exercised; the JDK HttpClient keeps this free of test-client deps.
 */
class PingControllerIT extends AbstractIntegrationTest {

    @LocalServerPort
    int port;

    private final HttpClient http = HttpClient.newHttpClient();

    private HttpResponse<String> get(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .GET().build();
        return http.send(request, HttpResponse.BodyHandlers.ofString());
    }

    @Test
    void pingIsPublicAndReturnsOk() throws Exception {
        HttpResponse<String> res = get("/api/v1/ping");
        assertThat(res.statusCode()).isEqualTo(200);
        assertThat(res.body())
                .contains("\"status\":\"ok\"")
                .contains("\"service\":\"gatherly-backend\"");
    }

    @Test
    void unknownProtectedRouteIsUnauthenticated() throws Exception {
        // Default-deny: a non-public route with no credentials → 401 in the uniform contract.
        HttpResponse<String> res = get("/api/v1/secure-does-not-exist");
        assertThat(res.statusCode()).isEqualTo(401);
        assertThat(res.body()).contains("UNAUTHENTICATED");
    }
}
