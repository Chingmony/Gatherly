package com.gatherly.integration.telegram;

import com.gatherly.config.TelegramProperties;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

/**
 * Outbound-only Telegram ops-channel client ({@code docs/04} §2.2). Posts {@code sendMessage} with
 * {@code parse_mode=HTML} to one channel; short read timeout so a slow Telegram never blocks a
 * caller. When disabled or unconfigured, logs instead of sending and returns {@code false}. Never
 * throws.
 */
@Component
public class TelegramNotifier {

  private static final Logger log = LoggerFactory.getLogger(TelegramNotifier.class);

  private final TelegramProperties props;
  private final RestClient restClient;

  public TelegramNotifier(TelegramProperties props) {
    this.props = props;
    JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory();
    factory.setReadTimeout(Duration.ofSeconds(5));
    this.restClient = RestClient.builder().requestFactory(factory).build();
  }

  /** Send a pre-formatted HTML message to the ops channel. Returns true on a 2xx response. */
  public boolean send(String html) {
      System.out.println(props);

    if (!props.enabled()) {
      log.info("[telegram disabled] {}", html.replaceAll("<[^>]+>", ""));
      return false;
    }
    if (!StringUtils.hasText(props.botToken()) || !StringUtils.hasText(props.opsChatId())) {
      log.warn("Telegram enabled but bot token / chat id missing; skipping push");
      return false;
    }
    try {
      restClient
          .post()
          .uri(props.apiBase() + "/bot{token}/sendMessage", props.botToken())
          .contentType(MediaType.APPLICATION_JSON)
          .body(Map.of("chat_id", props.opsChatId(), "text", html, "parse_mode", "HTML"))
          .retrieve()
          .toBodilessEntity();
      return true;
    } catch (RuntimeException ex) {
      log.error("Telegram ops push failed: {}", ex.getMessage());
      return false;
    }
  }

  public static String checkinText(
      String eventTitle,
      String guestName,
      String guestPhone,
      Instant checkedInAt,
      String scannedBy) {
    return "✅ <b>Checked in</b> — "
        + esc(eventTitle)
        + "\n👤 "
        + esc(orDash(guestName))
        + "   📞 "
        + esc(orDash(guestPhone))
        + "\n🕒 "
        + checkedInAt
        + "   🙋 by "
        + esc(orDash(scannedBy));
  }

  public static String registeredText(String eventTitle, String guestName, String guestPhone) {
    return "🆕 <b>Registered</b> — "
        + esc(eventTitle)
        + "\n👤 "
        + esc(orDash(guestName))
        + "   📞 "
        + esc(orDash(guestPhone));
  }

  public static String testText(String eventTitle) {
    return "🔔 <b>Test message</b> — ops channel wired for " + esc(eventTitle) + ".";
  }

  private static String orDash(String value) {
    return StringUtils.hasText(value) ? value : "—";
  }

  /** Escape the HTML-significant characters Telegram's HTML parse mode cares about. */
  private static String esc(String value) {
    return value == null
        ? ""
        : value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
  }
}
