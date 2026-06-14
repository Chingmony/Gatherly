package com.gatherly.common.error;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Single source of the uniform error envelope ({@code docs/07} §2.2). Every controller/service
 * exception is normalized here into an {@link ErrorResponse} with a stable {@link ErrorCode} and a
 * {@code traceId} that ties the response to logs/traces ({@code docs/08}).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  /** Application exceptions with an explicit, stable code. */
  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ErrorResponse> handleApi(ApiException ex, HttpServletRequest req) {
    ErrorCode code = ex.getCode();
    ErrorResponse body =
        ErrorResponse.of(
            code, ex.getMessage(), req.getRequestURI(), traceId(), ex.getFieldErrors());
    return ResponseEntity.status(code.status()).body(body);
  }

  /** Bean Validation failures on {@code @Valid} request bodies → aggregated field errors. */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidation(
      MethodArgumentNotValidException ex, HttpServletRequest req) {
    List<FieldErrorDetail> fields =
        ex.getBindingResult().getFieldErrors().stream()
            .map(
                fe ->
                    new FieldErrorDetail(
                        fe.getField(),
                        fe.getCode() == null ? "INVALID" : fe.getCode().toUpperCase(),
                        fe.getDefaultMessage()))
            .toList();
    ErrorResponse body =
        ErrorResponse.of(
            ErrorCode.VALIDATION_ERROR,
            "One or more fields are invalid.",
            req.getRequestURI(),
            traceId(),
            fields);
    return ResponseEntity.status(ErrorCode.VALIDATION_ERROR.status()).body(body);
  }

  /** Anything uncaught → opaque 500. Detail is logged, never returned to the client. */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex, HttpServletRequest req) {
    String traceId = traceId();
    log.error("Unhandled exception [traceId={}] on {}", traceId, req.getRequestURI(), ex);
    ErrorResponse body =
        ErrorResponse.of(
            ErrorCode.INTERNAL_ERROR,
            "An unexpected error occurred.",
            req.getRequestURI(),
            traceId,
            null);
    return ResponseEntity.status(ErrorCode.INTERNAL_ERROR.status()).body(body);
  }

  private static String traceId() {
    String fromMdc = MDC.get("traceId");
    return fromMdc != null ? fromMdc : UUID.randomUUID().toString().substring(0, 8);
  }
}
