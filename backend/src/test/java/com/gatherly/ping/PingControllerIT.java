package com.gatherly.ping;

import com.gatherly.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * {@code GET /api/v1/ping} is public (docs/03 §2.2) and returns the liveness payload — the
 * backend half of the M0 end-to-end demo.
 */
@AutoConfigureMockMvc
class PingControllerIT extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void pingIsPublicAndReturnsOk() throws Exception {
        mockMvc.perform(get("/api/v1/ping"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"))
                .andExpect(jsonPath("$.service").value("gatherly-backend"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void unknownProtectedRouteIsUnauthenticated() throws Exception {
        // Default-deny: a non-public route with no credentials → 401 in the uniform contract.
        mockMvc.perform(get("/api/v1/secure-does-not-exist"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
    }
}
