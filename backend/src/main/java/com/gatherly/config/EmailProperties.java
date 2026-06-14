package com.gatherly.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Email config bound from {@code app.email.*} ({@code docs/04} §2.1).
 *
 * @param enabled when false, emails are logged not sent (local/test sink behaviour)
 * @param fromAddress envelope sender
 * @param fromName sender display name
 */
@ConfigurationProperties(prefix = "app.email")
public record EmailProperties(boolean enabled, String fromAddress, String fromName) {}
