package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.config.JwtProperties;
import com.gatherly.dto.auth.ForgotPasswordRequest;
import com.gatherly.dto.auth.LoginRequest;
import com.gatherly.dto.auth.ResetPasswordRequest;
import com.gatherly.dto.auth.VerifyOtpRequest;
import com.gatherly.dto.auth.VerifyOtpResponse;
import com.gatherly.dto.user.UserResponse;
import com.gatherly.mapper.UserMapper;
import com.gatherly.security.AuthCookieService;
import com.gatherly.service.AuthService;
import com.gatherly.service.AuthTokens;
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

  @PostMapping("/login")
  public ApiResponse<UserResponse> login(
      @Valid @RequestBody LoginRequest request, HttpServletResponse response) {
    AuthTokens tokens = authService.login(request.email(), request.password());
    writeAuthCookies(response, tokens);
    return ApiResponse.ok("Logged in successfully.", userMapper.toResponse(tokens.user()));
  }

  @PostMapping("/refresh")
  public ApiResponse<Void> refresh(HttpServletRequest request, HttpServletResponse response) {
    AuthTokens tokens = authService.refresh(cookies.readRefresh(request));
    writeAuthCookies(response, tokens);
    return ApiResponse.ok("Token refreshed.");
  }

  @PostMapping("/logout")
  public ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
    authService.logout(cookies.readRefresh(request));
    response.addHeader(HttpHeaders.SET_COOKIE, cookies.clearAccess().toString());
    response.addHeader(HttpHeaders.SET_COOKIE, cookies.clearRefresh().toString());
    return ApiResponse.ok("Logged out.");
  }

  @PostMapping("/forgot-password")
  @ResponseStatus(HttpStatus.ACCEPTED)
  public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    authService.forgotPassword(request.email());
    return ApiResponse.ok("If an account exists for that email, a reset code has been sent.");
  }

  @PostMapping("/verify-otp")
  public ApiResponse<VerifyOtpResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
    return ApiResponse.ok("Code verified.", authService.verifyOtp(request.email(), request.otp()));
  }

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
