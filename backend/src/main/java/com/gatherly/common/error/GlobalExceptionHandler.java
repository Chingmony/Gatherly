package com.gatherly.common.error;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

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

  /** Unparseable/missing JSON body, or a value that fails type binding (e.g. bad enum). */
  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorResponse> handleUnreadable(
      HttpMessageNotReadableException ex, HttpServletRequest req) {
    ErrorResponse body =
        ErrorResponse.of(
            ErrorCode.MALFORMED_REQUEST,
            "Request body is missing or malformed.",
            req.getRequestURI(),
            traceId(),
            null);
    return ResponseEntity.status(ErrorCode.MALFORMED_REQUEST.status()).body(body);
  }

  /** A path/query value could not be converted to the target type (e.g. non-UUID id). */
  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<ErrorResponse> handleTypeMismatch(
      MethodArgumentTypeMismatchException ex, HttpServletRequest req) {
    String required =
        ex.getRequiredType() == null ? "the expected type" : ex.getRequiredType().getSimpleName();
    FieldErrorDetail field =
        new FieldErrorDetail(ex.getName(), "TYPE_MISMATCH", "Must be a valid " + required + ".");
    ErrorResponse body =
        ErrorResponse.of(
            ErrorCode.MALFORMED_REQUEST,
            "One or more request parameters are malformed.",
            req.getRequestURI(),
            traceId(),
            List.of(field));
    return ResponseEntity.status(ErrorCode.MALFORMED_REQUEST.status()).body(body);
  }

  /** A required query/form parameter was absent. */
  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ResponseEntity<ErrorResponse> handleMissingParam(
      MissingServletRequestParameterException ex, HttpServletRequest req) {
    FieldErrorDetail field =
        new FieldErrorDetail(ex.getParameterName(), "REQUIRED", "This parameter is required.");
    ErrorResponse body =
        ErrorResponse.of(
            ErrorCode.MALFORMED_REQUEST,
            "A required request parameter is missing.",
            req.getRequestURI(),
            traceId(),
            List.of(field));
    return ResponseEntity.status(ErrorCode.MALFORMED_REQUEST.status()).body(body);
  }

  /** Constraint violations on {@code @Validated} method params (path/query), per docs/07 §5. */
  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ErrorResponse> handleConstraintViolation(
      ConstraintViolationException ex, HttpServletRequest req) {
    List<FieldErrorDetail> fields =
        ex.getConstraintViolations().stream()
            .map(
                v -> {
                  String path = v.getPropertyPath().toString();
                  String field =
                      path.contains(".") ? path.substring(path.lastIndexOf('.') + 1) : path;
                  return new FieldErrorDetail(field, "INVALID", v.getMessage());
                })
            .toList();
    ErrorResponse body =
        ErrorResponse.of(
            ErrorCode.VALIDATION_ERROR,
            "One or more parameters are invalid.",
            req.getRequestURI(),
            traceId(),
            fields);
    return ResponseEntity.status(ErrorCode.VALIDATION_ERROR.status()).body(body);
  }

  /**
   * Authorization denials from method security ({@code @PreAuthorize}) or the filter chain → 403.
   * Explicit so the catch-all {@code Exception} handler below cannot swallow it into a 500 ({@code
   * docs/07} §5). Covers {@code AuthorizationDeniedException}, its Spring Security 6.x subclass.
   */
  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ErrorResponse> handleAccessDenied(
      AccessDeniedException ex, HttpServletRequest req) {
    ErrorResponse body =
        ErrorResponse.of(
            ErrorCode.FORBIDDEN,
            "You do not have permission to perform this action.",
            req.getRequestURI(),
            traceId(),
            null);
    return ResponseEntity.status(ErrorCode.FORBIDDEN.status()).body(body);
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
