package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.service.OpsNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Telegram ops integration ({@code docs/03} §4.11) — outbound only. Sends a test message to the ops
 * channel; the gate lives on {@link OpsNotificationService#sendTest}.
 */
@Tag(
    name = "Telegram Ops",
    description =
        "Outbound-only Telegram ops integration. Lets organizers verify the ops-channel wiring for"
            + " an event by sending a test message.")
@RestController
@RequestMapping("/events/{eventId}/telegram")
public class TelegramController {

  private final OpsNotificationService opsNotificationService;

  public TelegramController(OpsNotificationService opsNotificationService) {
    this.opsNotificationService = opsNotificationService;
  }

  @Operation(
      summary = "Send a Telegram test message",
      description =
          "Sends a test message to the configured ops channel for the event and reports whether it"
              + " was delivered (`{\"delivered\": true|false}`; false when Telegram is disabled or"
              + " unconfigured). Requires manage rights (ADMIN or event MANAGER). Errors: 403"
              + " FORBIDDEN.")
  @PostMapping("/test")
  public ApiResponse<Map<String, Boolean>> test(@PathVariable UUID eventId) {
    boolean delivered = opsNotificationService.sendTest(eventId);
    return ApiResponse.ok(
        delivered ? "Test message sent." : "Telegram is disabled or unconfigured.",
        Map.of("delivered", delivered));
  }
}
