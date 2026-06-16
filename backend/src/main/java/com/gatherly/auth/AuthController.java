package com.gatherly.auth;

import com.gatherly.auth.dto.ForgotPasswordRequest;
import com.gatherly.auth.dto.LoginRequest;
import com.gatherly.auth.dto.ResetPasswordRequest;
import com.gatherly.auth.dto.SetupRequiredResponse;
import com.gatherly.auth.dto.VerifyOtpRequest;
import com.gatherly.auth.dto.VerifyOtpResponse;
import com.gatherly.user.UserMapper;
import com.gatherly.user.dto.UserResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Auth endpoints (docs/03 §4.1). Public surface ({@code /auth/**} is permitAll); tokens are set
 * as httpOnly cookies, so responses carry only the user summary, never raw tokens.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Returns the user summary on a normal login, or a {@link SetupRequiredResponse} when an
     * invited account redeemed its one-time code (the client then routes to set-password).
     */
    @PostMapping("/login")
    public ResponseEntity<Object> login(@Valid @RequestBody LoginRequest req, HttpServletResponse response) {
        LoginOutcome outcome = authService.login(req, response);
        if (outcome.setupRequired()) {
            return ResponseEntity.ok(new SetupRequiredResponse(true, outcome.setupEmail(), outcome.resetGrant()));
        }
        return ResponseEntity.ok(UserMapper.toResponse(outcome.user()));
    }

    @PostMapping("/refresh")
    public UserResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        return UserMapper.toResponse(authService.refresh(request, response));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        // 202 when a code was (re)sent; 404 ACCOUNT_NOT_FOUND for an unknown email so the UI can tell
        // the person to contact an admin — Gatherly is invite-only, not public (docs/04 §3.5).
        authService.forgotPassword(req.email());
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/verify-otp")
    public VerifyOtpResponse verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        return new VerifyOtpResponse(authService.verifyOtp(req.email(), req.code()));
    }

    /** Set a password via a one-time grant — used by both invite activation and password reset. */
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
