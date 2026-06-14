package com.gatherly.common.error;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.UUID;

/**
 * Single source of the uniform error contract (docs/07 §2, §5). Every non-2xx that flows
 * through MVC is mapped here to {@link ApiError}; filter-level auth failures are handled by
 * the security entry-point/handlers in {@code SecurityConfig} using the same shape.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ---- Field-level validation (DTO bean validation) -----------------------

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> handleDtoValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<ApiFieldError> fields = ex.getBindingResult().getFieldErrors().stream()
                .map(GlobalExceptionHandler::toFieldError)
                .toList();
        return body(ErrorCode.VALIDATION_ERROR, "One or more fields are invalid.", req, fields);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest req) {
        List<ApiFieldError> fields = ex.getConstraintViolations().stream()
                .map(GlobalExceptionHandler::toFieldError)
                .toList();
        return body(ErrorCode.VALIDATION_ERROR, "One or more fields are invalid.", req, fields);
    }

    @ExceptionHandler(FormValidationException.class)
    ResponseEntity<ApiError> handleFormValidation(FormValidationException ex, HttpServletRequest req) {
        return body(ErrorCode.VALIDATION_ERROR, ex.getMessage(), req, ex.fieldErrors());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> handleUnreadable(HttpMessageNotReadableException ex, HttpServletRequest req) {
        return body(ErrorCode.MALFORMED_REQUEST, "Request body is missing or malformed.", req, null);
    }

    // ---- Security ------------------------------------------------------------

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
        return body(ErrorCode.FORBIDDEN, "You do not have permission to perform this action.", req, null);
    }

    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ApiError> handleAuthentication(AuthenticationException ex, HttpServletRequest req) {
        return body(ErrorCode.UNAUTHENTICATED, "Authentication is required.", req, null);
    }

    // ---- Persistence conflicts ----------------------------------------------

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiError> handleDataIntegrity(DataIntegrityViolationException ex, HttpServletRequest req) {
        // Specific constraint-name mapping (e.g. uq_event_checkin_submission → ALREADY_CHECKED_IN)
        // is added by the services that own those constraints. Default: generic conflict.
        return body(ErrorCode.CONFLICT, "The request conflicts with the current state.", req, null);
    }

    // ---- Domain exceptions ---------------------------------------------------

    @ExceptionHandler(RateLimitExceededException.class)
    ResponseEntity<ApiError> handleRateLimit(RateLimitExceededException ex, HttpServletRequest req) {
        ApiError error = ApiError.of(ex.code(), ex.getMessage(), req.getRequestURI(), newTraceId());
        return ResponseEntity.status(ex.code().status())
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.retryAfterSeconds()))
                .body(error);
    }

    @ExceptionHandler(AppException.class)
    ResponseEntity<ApiError> handleApp(AppException ex, HttpServletRequest req) {
        return body(ex.code(), ex.getMessage(), req, null);
    }

    // ---- Catch-all (never leak internals) -----------------------------------

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> handleUnexpected(Exception ex, HttpServletRequest req) {
        String traceId = newTraceId();
        log.error("Unhandled exception [traceId={}] on {} {}", traceId, req.getMethod(), req.getRequestURI(), ex);
        ApiError error = ApiError.of(ErrorCode.INTERNAL_ERROR,
                "An unexpected error occurred.", req.getRequestURI(), traceId);
        return ResponseEntity.status(ErrorCode.INTERNAL_ERROR.status()).body(error);
    }

    // ---- Helpers -------------------------------------------------------------

    private ResponseEntity<ApiError> body(ErrorCode code, String message, HttpServletRequest req,
                                          List<ApiFieldError> fields) {
        ApiError error = ApiError.of(code, message, req.getRequestURI(), newTraceId(), fields);
        return ResponseEntity.status(code.status()).body(error);
    }

    private static String newTraceId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    private static ApiFieldError toFieldError(FieldError fe) {
        return new ApiFieldError(fe.getField(), stableCode(fe.getCode()), fe.getDefaultMessage());
    }

    private static ApiFieldError toFieldError(ConstraintViolation<?> v) {
        String field = v.getPropertyPath() == null ? null : v.getPropertyPath().toString();
        String annotation = v.getConstraintDescriptor() == null ? null
                : v.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName();
        return new ApiFieldError(field, stableCode(annotation), v.getMessage());
    }

    /** Maps a Bean Validation annotation name to a stable field error code (docs/07 §2). */
    private static String stableCode(String annotation) {
        if (annotation == null) {
            return "INVALID";
        }
        return switch (annotation) {
            case "NotNull", "NotBlank", "NotEmpty" -> "REQUIRED";
            case "Email", "Pattern" -> "PATTERN";
            case "Size", "Length" -> "SIZE";
            case "Min", "Max", "Positive", "PositiveOrZero", "Negative" -> "RANGE";
            default -> "INVALID";
        };
    }
}
