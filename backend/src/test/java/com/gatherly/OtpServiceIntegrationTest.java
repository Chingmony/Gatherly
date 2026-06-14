package com.gatherly;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.service.OtpService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * OTP lifecycle against a real Redis container ({@code docs/04} §3): issue → verify → single-use
 * grant, wrong-code rejection, and resend cooldown.
 */
class OtpServiceIntegrationTest extends AbstractIntegrationTest {

  @Autowired private OtpService otpService;

  @Test
  void issueVerifyConsumeHappyPath() {
    UUID userId = UUID.randomUUID();

    String code = otpService.issue(userId);
    assertThat(code).hasSize(6).containsOnlyDigits();

    String grant = otpService.verify(userId, code);
    assertThat(grant).isNotBlank();

    assertThat(otpService.consumeGrant(userId, grant)).isTrue();
    // single-use: a second consume fails
    assertThat(otpService.consumeGrant(userId, grant)).isFalse();
  }

  @Test
  void wrongCodeIsRejected() {
    UUID userId = UUID.randomUUID();
    String code = otpService.issue(userId);
    String wrong = code.equals("000000") ? "111111" : "000000";

    assertThatThrownBy(() -> otpService.verify(userId, wrong))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getCode())
        .isEqualTo(ErrorCode.VALIDATION_ERROR);
  }

  @Test
  void resendWithinCooldownIsRateLimited() {
    UUID userId = UUID.randomUUID();
    otpService.issue(userId);

    assertThatThrownBy(() -> otpService.issue(userId))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getCode())
        .isEqualTo(ErrorCode.RATE_LIMITED);
  }
}
