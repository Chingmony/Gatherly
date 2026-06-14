package com.gatherly.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Telegram Bot config bound from {@code app.telegram.*} ({@code docs/04} §2.2). Outbound only — no
 * webhook. When {@code enabled=false}, messages are logged not sent (local/test).
 *
 * @param enabled feature flag
 * @param botToken bot token from BotFather
 * @param opsChatId target ops channel/group chat id
 * @param apiBase Telegram API base (default {@code https://api.telegram.org})
 */
@ConfigurationProperties(prefix = "app.telegram")
public record TelegramProperties(
    boolean enabled, String botToken, String opsChatId, String apiBase) {}
