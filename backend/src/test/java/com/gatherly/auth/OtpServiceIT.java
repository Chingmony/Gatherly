package com.gatherly.auth;

import com.gatherly.AbstractIntegrationTest;
import com.gatherly.common.error.AppException;
import com.gatherly.common.error.RateLimitExceededException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * OTP lifecycle against real Redis (docs/04 §3.4): request → verify → single-use grant, plus the
 * rejection paths (wrong code, attempt cap, resend cooldown).
 */
class OtpServiceIT extends AbstractIntegrationTest {

    @Autowired
    OtpService otp;

    @Test
    void requestVerifyYieldsSingleUseGrant() {
        UUID user = UUID.randomUUID();
        String code = otp.requestOtp(user);

        String grant = otp.verifyOtp(user, code);
        assertThat(grant).isNotBlank();

        assertThat(otp.consumeGrant(user, grant)).isTrue();   // first use succeeds
        assertThat(otp.consumeGrant(user, grant)).isFalse();  // single-use
    }

    @Test
    void wrongCodeIsRejected() {
        UUID user = UUID.randomUUID();
        String code = otp.requestOtp(user);
        String wrong = code.equals("000000") ? "111111" : "000000";

        assertThatThrownBy(() -> otp.verifyOtp(user, wrong)).isInstanceOf(AppException.class);
    }

    @Test
    void exceedingAttemptsInvalidatesCode() {
        UUID user = UUID.randomUUID();
        String code = otp.requestOtp(user);
        String wrong = code.equals("000000") ? "111111" : "000000";

        // Burn past the attempt cap with wrong guesses.
        for (int i = 0; i < 6; i++) {
            try {
                otp.verifyOtp(user, wrong);
            } catch (AppException ignored) {
                // expected
            }
        }
        // Even the correct code no longer works — the OTP was invalidated.
        assertThatThrownBy(() -> otp.verifyOtp(user, code)).isInstanceOf(AppException.class);
    }

    @Test
    void resendWithinCooldownIsRateLimited() {
        UUID user = UUID.randomUUID();
        otp.requestOtp(user);
        assertThatThrownBy(() -> otp.requestOtp(user)).isInstanceOf(RateLimitExceededException.class);
    }
}
