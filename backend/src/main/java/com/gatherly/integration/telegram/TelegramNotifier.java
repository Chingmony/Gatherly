package com.gatherly.integration.telegram;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Map;

/**
 * Outbound Telegram Bot API client (docs/04 §2.2) — posts ops-channel messages via
 * {@code sendMessage}. Outbound only: no webhook, no inbound handling. Honors {@code TELEGRAM_ENABLED}
 * exactly like {@link com.gatherly.integration.email.EmailService}: when disabled (local/test/CI) the
 * send is a no-op WARN, so flows stay testable without a real bot. Short connect/read timeouts so a
 * slow Telegram never blocks the caller; never throws — failures return {@code false} and the
 * {@code telegram_notified=false} row is left for the retry sweep (docs/06 §7).
 */
@Component
public class TelegramNotifier {

    private static final Logger log = LoggerFactory.getLogger(TelegramNotifier.class);

    private final boolean enabled;
    private final String botToken;
    private final String opsChatId;
    private final RestClient client;

    public TelegramNotifier(@Value("${gatherly.telegram.enabled:false}") boolean enabled,
                            @Value("${gatherly.telegram.bot-token:}") String botToken,
                            @Value("${gatherly.telegram.ops-chat-id:}") String opsChatId,
                            @Value("${gatherly.telegram.api-base:https://api.telegram.org}") String apiBase,
                            @Value("${gatherly.telegram.timeout-seconds:5}") long timeoutSeconds) {
        this.enabled = enabled;
        this.botToken = botToken;
        this.opsChatId = opsChatId;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(timeoutSeconds));
        factory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));
        this.client = RestClient.builder()
                .baseUrl(apiBase.replaceAll("/$", ""))
                .requestFactory(factory)
                .build();
    }

    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Post an HTML message to the ops channel. Returns {@code true} only on a 2xx from Telegram — the
     * caller uses that to flip {@code telegram_notified}. Disabled, misconfigured, or failed sends
     * return {@code false} (the row stays un-notified for the sweep).
     */
    public boolean send(String html) {
        if (!enabled) {
            log.warn("TELEGRAM disabled — ops message not sent:\n{}", html);
            return false;
        }
        if (botToken.isBlank() || opsChatId.isBlank()) {
            log.warn("TELEGRAM enabled but bot-token/ops-chat-id not configured — skipping send");
            return false;
        }
        try {
            client.post()
                    .uri("/bot{token}/sendMessage", botToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("chat_id", opsChatId, "text", html, "parse_mode", "HTML"))
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (Exception ex) {
            // Best-effort: never surface a Telegram failure to the user action; the sweep retries.
            log.error("Telegram sendMessage failed: {}", ex.getMessage());
            return false;
        }
    }
}
