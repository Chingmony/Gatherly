package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.config.JwtProperties;
import com.gatherly.dto.auth.ForgotPasswordRequest;
import com.gatherly.dto.auth.LoginRequest;
import com.gatherly.dto.auth.LoginResponse;
import com.gatherly.dto.auth.ResetPasswordRequest;
import com.gatherly.dto.auth.VerifyOtpRequest;
import com.gatherly.dto.auth.VerifyOtpResponse;
import com.gatherly.mapper.UserMapper;
import com.gatherly.security.AuthCookieService;
import com.gatherly.service.AuthService;
import com.gatherly.service.AuthTokens;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Public auth surface ({@code docs/03} §4.1). Tokens are delivered as httpOnly cookies. */
@Tag(
    name = "Authentication",
    description =
        "Login, token rotation, logout, and the OTP-based password-reset flow. All endpoints are"
            + " public (no bearer token required).")
@RestController
@RequestMapping("/auth")
public class AuthController {

  private final AuthService authService;
  private final AuthCookieService cookies;
  private final UserMapper userMapper;
  private final long accessTtl;
  private final long refreshTtl;

  public AuthController(
      AuthService authService,
      AuthCookieService cookies,
      UserMapper userMapper,
      JwtProperties jwtProperties) {
    this.authService = authService;
    this.cookies = cookies;
    this.userMapper = userMapper;
    this.accessTtl = jwtProperties.accessTokenTtlSeconds();
    this.refreshTtl = jwtProperties.refreshTokenTtlSeconds();
  }

  @Operation(
      summary = "Log in with email and password",
      description =
          "Authenticates the credentials and, on success, returns a Bearer access token (15-min"
              + " TTL) plus the user profile. The access and rotating refresh tokens are also set as"
              + " httpOnly cookies for the web app. Errors: 401 INVALID_CREDENTIALS for a wrong"
              + " email/password, 429 RATE_LIMITED when the per-IP login limit is exceeded.")
  @PostMapping("/login")
  public ApiResponse<LoginResponse> login(
      @Valid @RequestBody LoginRequest request, HttpServletResponse response) {
    AuthTokens tokens = authService.login(request.email(), request.password());
    writeAuthCookies(response, tokens);
    LoginResponse body =
        new LoginResponse(
            "Bearer", tokens.accessToken(), accessTtl, userMapper.toResponse(tokens.user()));
    return ApiResponse.ok("Logged in successfully.", body);
  }

  @Operation(
      summary = "Refresh the access token",
      description =
          "Reads the httpOnly refresh cookie and issues a fresh access + refresh pair. The previous"
              + " refresh token is invalidated on rotation, so a reused/stolen token is rejected."
              + " Errors: 401 UNAUTHENTICATED when the refresh cookie is missing, expired, revoked,"
              + " or already rotated.")
  @PostMapping("/refresh")
  public ApiResponse<Void> refresh(HttpServletRequest request, HttpServletResponse response) {
    AuthTokens tokens = authService.refresh(cookies.readRefresh(request));
    writeAuthCookies(response, tokens);
    return ApiResponse.ok("Token refreshed.");
  }

  @Operation(
      summary = "Log out",
      description =
          "Revokes the current refresh token and clears the access/refresh cookies. Idempotent —"
              + " safe to call without a valid session.")
  @PostMapping("/logout")
  public ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
    authService.logout(cookies.readRefresh(request));
    response.addHeader(HttpHeaders.SET_COOKIE, cookies.clearAccess().toString());
    response.addHeader(HttpHeaders.SET_COOKIE, cookies.clearRefresh().toString());
    return ApiResponse.ok("Logged out.");
  }

  @Operation(
      summary = "Start a password reset (request OTP)",
      description =
          "Begins the OTP reset flow. Always responds 202 with a neutral message to prevent account"
              + " enumeration. If the account exists, a hashed one-time code is stored in Redis"
              + " (TTL-bound) and emailed. Errors: 429 RATE_LIMITED when the OTP request limit is"
              + " exceeded.")
  @PostMapping("/forgot-password")
  @ResponseStatus(HttpStatus.ACCEPTED)
  public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    authService.forgotPassword(request.email());
    return ApiResponse.ok("If an account exists for that email, a reset code has been sent.");
  }

  @Operation(
      summary = "Resend the password-reset OTP",
      description =
          "Re-issues the OTP for an in-progress reset (the verify-otp \"resend code\" action)."
              + " Behaves like forgot-password: always responds 202 with a neutral message to"
              + " prevent account enumeration. A 60s per-account cooldown (silently enforced) plus"
              + " the per-IP OTP limit throttle abuse. Errors: 429 RATE_LIMITED when the per-IP OTP"
              + " request limit is exceeded.")
  @PostMapping("/resend-otp")
  @ResponseStatus(HttpStatus.ACCEPTED)
  public ApiResponse<Void> resendOtp(@Valid @RequestBody ForgotPasswordRequest request) {
    authService.forgotPassword(request.email());
    return ApiResponse.ok("If an account exists for that email, a reset code has been sent.");
  }

  @Operation(
      summary = "Verify the password-reset OTP",
      description =
          "Validates the emailed OTP for the given email and returns a short-lived reset grant"
              + " token to be passed to reset-password. Errors: 401 OTP_INVALID (wrong code or too"
              + " many attempts) / OTP_EXPIRED (code TTL elapsed).")
  @PostMapping("/verify-otp")
  public ApiResponse<VerifyOtpResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
    return ApiResponse.ok("Code verified.", authService.verifyOtp(request.email(), request.otp()));
  }

  @Operation(
      summary = "Reset the password",
      description =
          "Consumes the reset grant from verify-otp and sets the new password (min 8 chars). The"
              + " grant is single-use and invalidated afterwards. Errors: 401 when the reset token"
              + " is invalid or expired; 400 VALIDATION_ERROR for a non-conforming new password.")
  @PostMapping("/reset-password")
  public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    authService.resetPassword(request.email(), request.resetToken(), request.newPassword());
    return ApiResponse.ok("Password updated. Please log in with your new password.");
  }

  private void writeAuthCookies(HttpServletResponse response, AuthTokens tokens) {
    response.addHeader(
        HttpHeaders.SET_COOKIE, cookies.access(tokens.accessToken(), accessTtl).toString());
    response.addHeader(
        HttpHeaders.SET_COOKIE, cookies.refresh(tokens.refreshToken(), refreshTtl).toString());
  }
}
