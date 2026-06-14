package com.gatherly.auth;

import com.gatherly.auth.dto.ForgotPasswordRequest;
import com.gatherly.auth.dto.LoginRequest;
import com.gatherly.auth.dto.ResetPasswordRequest;
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

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest req, HttpServletResponse response) {
        return UserMapper.toResponse(authService.login(req, response));
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
        authService.forgotPassword(req.email());
        // Always 202 — never reveal whether the account exists (docs/04 §3.5).
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/verify-otp")
    public VerifyOtpResponse verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        return new VerifyOtpResponse(authService.verifyOtp(req.email(), req.code()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
