package com.gatherly.integration.email;

/**
 * Parameters for a QR-ticket email ({@code docs/04} §2.1). {@code qrPng} is embedded inline (CID)
 * so it renders without an external fetch.
 */
public record QrTicketEmail(
    String toEmail,
    String guestName,
    String eventTitle,
    String eventWhen,
    String venue,
    String ticketUrl,
    byte[] qrPng) {}
