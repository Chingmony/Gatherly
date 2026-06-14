package com.gatherly.common.error;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Valid;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Standalone web-layer test for {@link GlobalExceptionHandler}: asserts each malformed-input path
 * yields the spec-correct {@code 400} envelope ({@code docs/07} §4-5) rather than an opaque {@code
 * 500}. Uses a synthetic controller + {@code standaloneSetup} so no Spring context / Docker is
 * required.
 */
class GlobalExceptionHandlerTest {

  private MockMvc mvc;

  @BeforeEach
  void setUp() {
    mvc =
        MockMvcBuilders.standaloneSetup(new TestController())
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
  }

  @Test
  void malformedJsonBody_returns400MalformedRequest() throws Exception {
    mvc.perform(
            post("/test/body").contentType(MediaType.APPLICATION_JSON).content("{ not valid json "))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error").value("MALFORMED_REQUEST"));
  }

  @Test
  void beanValidationFailure_returns400ValidationErrorWithFieldErrors() throws Exception {
    mvc.perform(
            post("/test/body").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.fieldErrors[0].field").value("name"));
  }

  @Test
  void badUuidPathVariable_returns400MalformedRequest() throws Exception {
    mvc.perform(get("/test/not-a-uuid"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("MALFORMED_REQUEST"))
        .andExpect(jsonPath("$.fieldErrors[0].field").value("id"));
  }

  @Test
  void missingRequiredParam_returns400MalformedRequest() throws Exception {
    mvc.perform(get("/test/search"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("MALFORMED_REQUEST"))
        .andExpect(jsonPath("$.fieldErrors[0].field").value("q"));
  }

  @Test
  void constraintViolation_returns400ValidationError() throws Exception {
    mvc.perform(get("/test/constraint"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.fieldErrors[0].field").value("value"));
  }

  @Test
  void accessDenied_returns403Forbidden() throws Exception {
    mvc.perform(get("/test/denied"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error").value("FORBIDDEN"));
  }

  @Test
  void methodSecurityDenial_returns403Forbidden() throws Exception {
    // AuthorizationDeniedException (thrown by @PreAuthorize) is an AccessDeniedException subclass;
    // the dedicated handler must win over the catch-all Exception handler (no 500 leakage).
    mvc.perform(get("/test/denied-method-security"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error").value("FORBIDDEN"));
  }

  @RestController
  static class TestController {

    @PostMapping("/test/body")
    String body(@Valid @RequestBody Payload payload) {
      return payload.name();
    }

    @GetMapping("/test/{id}")
    String byId(@PathVariable UUID id) {
      return id.toString();
    }

    @GetMapping("/test/search")
    String search(@RequestParam String q) {
      return q;
    }

    @GetMapping("/test/constraint")
    String constraint() {
      Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
      throw new ConstraintViolationException(validator.validate(new Bean()));
    }

    @GetMapping("/test/denied")
    String denied() {
      throw new AccessDeniedException("nope");
    }

    @GetMapping("/test/denied-method-security")
    String deniedMethodSecurity() {
      throw new AuthorizationDeniedException(
          "Access Denied", new AuthorizationDecision(false));
    }
  }

  record Payload(@NotBlank String name) {}

  static class Bean {
    @NotNull String value;
  }
}
