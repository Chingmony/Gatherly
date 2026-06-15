package com.gatherly.user.event;

import com.gatherly.auth.OtpService;
import com.gatherly.integration.email.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * After the invite transaction commits (docs/06 §2, §3a), mint a one-time sign-in code and email
 * it. The invitee enters it (with their email) on the login page, which detects the OTP and routes
 * them to set a password. Running after commit means a slow/failed mail server can never roll back
 * user creation; {@link EmailService} swallows its own send failures.
 */
@Component
public class UserCreatedListener {

    private final OtpService otpService;
    private final EmailService email;
    private final long inviteTtlSeconds;

    public UserCreatedListener(OtpService otpService, EmailService email,
                               @Value("${gatherly.auth.otp.invite-ttl-seconds:86400}") long inviteTtlSeconds) {
        this.otpService = otpService;
        this.email = email;
        this.inviteTtlSeconds = inviteTtlSeconds;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onUserCreated(UserCreatedEvent event) {
        String otp = otpService.requestOtp(event.userId(), inviteTtlSeconds);
        email.sendInviteOtp(event.email(), event.fullName(), otp, (int) (inviteTtlSeconds / 60));
    }
}
