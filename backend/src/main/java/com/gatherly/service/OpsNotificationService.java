package com.gatherly.service;

import java.util.UUID;

/** Ops-channel (Telegram) forwarding ({@code docs/04} §2.2, {@code docs/06} §7). */
public interface OpsNotificationService {

  /** Push a confirmed check-in to the ops channel; flip {@code telegram_notified} on success. */
  void pushCheckin(UUID checkinId);

  /** Push a new registration to the ops channel (fire-and-forget — no retry flag). */
  void pushRegistration(UUID submissionId);

  /** Send a test message to the ops channel (Manager/Admin). Returns whether it was delivered. */
  boolean sendTest(UUID eventId);
}
