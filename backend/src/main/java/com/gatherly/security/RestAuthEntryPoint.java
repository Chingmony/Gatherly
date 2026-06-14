package com.gatherly.security;

import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.error.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/** Renders a uniform {@code 401 UNAUTHENTICATED} JSON envelope when no valid token is present. */
@Component
public class RestAuthEntryPoint implements AuthenticationEntryPoint {

  private final ObjectMapper objectMapper;

  public RestAuthEntryPoint(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @Override
  public void commence(
      HttpServletRequest request, HttpServletResponse response, AuthenticationException ex)
      throws IOException {
    ErrorResponse body =
        ErrorResponse.of(
            ErrorCode.UNAUTHENTICATED,
            "Authentication is required to access this resource.",
            request.getRequestURI(),
            null,
            null);
    response.setStatus(ErrorCode.UNAUTHENTICATED.status().value());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    objectMapper.writeValue(response.getWriter(), body);
  }
}
