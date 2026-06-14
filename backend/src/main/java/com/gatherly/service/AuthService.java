package com.gatherly.service;

import com.gatherly.dto.auth.VerifyOtpResponse;

/** Authentication + password-reset operations ({@code docs/03} §2.3, {@code docs/06} §3). */
public interface AuthService {

  AuthTokens login(String email, String password);

  /**
   * Rotate: validate the refresh token, revoke it, and issue a fresh pair. Reuse revokes the chain.
   */
  AuthTokens refresh(String rawRefreshToken);

  void logout(String rawRefreshToken);

  /** Start OTP reset. Always succeeds silently (no account enumeration). */
  void forgotPassword(String email);

  VerifyOtpResponse verifyOtp(String email, String otp);

  void resetPassword(String email, String resetToken, String newPassword);
}
