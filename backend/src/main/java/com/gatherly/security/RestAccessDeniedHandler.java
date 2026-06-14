package com.gatherly.security;

import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.error.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/**
 * Renders a uniform {@code 403 FORBIDDEN} JSON envelope when an authenticated user fails a gate.
 * Never leaks cross-event resource existence ({@code docs/03} §6).
 */
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

  private final ObjectMapper objectMapper;

  public RestAccessDeniedHandler(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public void handle(
      HttpServletRequest request, HttpServletResponse response, AccessDeniedException ex)
      throws IOException {
    ErrorResponse body =
        ErrorResponse.of(
            ErrorCode.FORBIDDEN,
            "You do not have permission to perform this action.",
            request.getRequestURI(),
            null,
            null);
    response.setStatus(ErrorCode.FORBIDDEN.status().value());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    objectMapper.writeValue(response.getWriter(), body);
  }
}
