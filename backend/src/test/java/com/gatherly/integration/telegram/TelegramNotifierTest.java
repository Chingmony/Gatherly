package com.gatherly.integration.telegram;

import static org.assertj.core.api.Assertions.assertThat;

import com.gatherly.config.TelegramProperties;
import java.time.Instant;
import org.junit.jupiter.api.Test;

/** Unit tests for Telegram message formatting and the disabled-guard (no network). */
class TelegramNotifierTest {

  @Test
  void disabledNotifierLogsAndReturnsFalse() {
    TelegramNotifier notifier =
        new TelegramNotifier(new TelegramProperties(false, "", "", "https://api.telegram.org"));
    assertThat(notifier.send("hello")).isFalse();
  }

  @Test
  void enabledButUnconfiguredReturnsFalse() {
    TelegramNotifier notifier =
        new TelegramNotifier(new TelegramProperties(true, "", "", "https://api.telegram.org"));
    assertThat(notifier.send("hello")).isFalse();
  }

  @Test
  void checkinTextIncludesGuestAndEscapesHtml() {
    String text =
        TelegramNotifier.checkinText(
            "Launch <2026>",
            "Dara & Co",
            "+855 12 000",
            Instant.parse("2026-06-14T10:00:00Z"),
            "Admin");
    assertThat(text)
        .contains("Checked in")
        .contains("Launch &lt;2026&gt;")
        .contains("Dara &amp; Co")
        .contains("+855 12 000")
        .contains("by Admin");
  }

  @Test
  void registeredTextUsesDashForMissingFields() {
    String text = TelegramNotifier.registeredText("Launch", null, null);
    assertThat(text).contains("Registered").contains("—");
  }
}
