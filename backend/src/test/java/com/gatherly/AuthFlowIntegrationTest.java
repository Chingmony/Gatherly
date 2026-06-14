package com.gatherly;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.ObjectMapper;

/**
 * End-to-end auth flow over the full Spring Security filter chain (MockMvc) against real Postgres +
 * Redis containers. Exercises the seeded admin login, self-profile, the 401/403 gates, and
 * refresh-token rotation with reuse detection ({@code docs/03} §2.3, §8).
 */
class AuthFlowIntegrationTest extends AbstractIntegrationTest {

  private static final String ADMIN_EMAIL = "admin@gmail.com";
  private static final String ADMIN_PASSWORD = "123"; // V2__seed_admin.sql

  @Autowired private WebApplicationContext context;
  @Autowired private ObjectMapper objectMapper;

  private MockMvc mockMvc;

  @BeforeEach
  void setUpMockMvc() {
    mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
  }

  @Test
  void seededAdminCanLogInAndFetchOwnProfile() throws Exception {
    Cookie[] cookies = login(ADMIN_EMAIL, ADMIN_PASSWORD);

    mockMvc
        .perform(get("/me").cookie(named(cookies, "access_token")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.data.email").value(ADMIN_EMAIL))
        .andExpect(jsonPath("$.data.globalRole").value("ADMIN"));
  }

  @Test
  void unauthenticatedRequestIsRejectedWith401() throws Exception {
    mockMvc
        .perform(get("/me"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
  }

  @Test
  void memberCannotListUsersButAdminCan() throws Exception {
    Cookie adminAccess = named(login(ADMIN_EMAIL, ADMIN_PASSWORD), "access_token");

    // Admin lists users — allowed, paginated envelope.
    mockMvc
        .perform(get("/users").cookie(adminAccess))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.pagination.page").value(1));

    // Admin creates a MEMBER.
    String email = "member-" + UUID.randomUUID() + "@example.com";
    String createBody =
        objectMapper.writeValueAsString(
            Map.of(
                "email", email,
                "password", "Password123",
                "fullName", "Test Member",
                "globalRole", "MEMBER"));
    mockMvc
        .perform(
            post("/users")
                .cookie(adminAccess)
                .contentType(MediaType.APPLICATION_JSON)
                .content(createBody))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.data.globalRole").value("MEMBER"));

    // That MEMBER is forbidden from the Admin-only list endpoint.
    Cookie memberAccess = named(login(email, "Password123"), "access_token");
    mockMvc
        .perform(get("/users").cookie(memberAccess))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error").value("FORBIDDEN"));
  }

  @Test
  void refreshRotatesAndReuseRevokesTheChain() throws Exception {
    Cookie[] first = login(ADMIN_EMAIL, ADMIN_PASSWORD);
    Cookie refresh1 = named(first, "refresh_token");

    // Rotate once → new refresh; refresh1 is now revoked.
    MvcResult r2 =
        mockMvc
            .perform(post("/auth/refresh").cookie(refresh1))
            .andExpect(status().isOk())
            .andReturn();
    Cookie refresh2 = r2.getResponse().getCookie("refresh_token");
    assertThat(refresh2).isNotNull();
    assertThat(refresh2.getValue()).isNotEqualTo(refresh1.getValue());

    // The fresh token still works.
    mockMvc.perform(post("/auth/refresh").cookie(refresh2)).andExpect(status().isOk());

    // Reusing the original (revoked) token → 401 and the chain is revoked.
    mockMvc
        .perform(post("/auth/refresh").cookie(refresh1))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
  }

  @Test
  void wrongPasswordIsRejectedWith401() throws Exception {
    String body =
        objectMapper.writeValueAsString(Map.of("email", ADMIN_EMAIL, "password", "wrong-password"));
    mockMvc
        .perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("UNAUTHENTICATED"));
  }

  private Cookie[] login(String email, String password) throws Exception {
    String body = objectMapper.writeValueAsString(Map.of("email", email, "password", password));
    MvcResult result =
        mockMvc
            .perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andReturn();
    return result.getResponse().getCookies();
  }

  private static Cookie named(Cookie[] cookies, String name) {
    for (Cookie c : cookies) {
      if (name.equals(c.getName())) {
        return c;
      }
    }
    throw new AssertionError("cookie not found: " + name);
  }
}
