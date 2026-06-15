package com.gatherly.integration.email;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Transactional email (docs/04 §2.1). M1 delivers password-reset OTP codes; the QR-ticket email
 * is added in M6 on the same client. Honors {@code EMAIL_ENABLED}: when disabled (local/test),
 * the send is skipped — and the OTP is logged at WARN so non-prod flows remain testable without
 * an SMTP server (never enable that in production).
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final boolean enabled;
    private final String fromAddress;
    private final String fromName;

    public EmailService(JavaMailSender mailSender,
                        @Value("${gatherly.email.enabled:false}") boolean enabled,
                        @Value("${gatherly.email.from:no-reply@gatherly.local}") String fromAddress,
                        @Value("${gatherly.email.from-name:Gatherly}") String fromName) {
        this.mailSender = mailSender;
        this.enabled = enabled;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
    }

    /**
     * Invite an added user (docs/06 §3a): email a one-time sign-in code. The user enters it (with
     * their email) on the login page, which routes them to set a real password. Replaces the older
     * activation-link flow with the same OTP mechanism as password reset.
     */
    public void sendInviteOtp(String toEmail, String fullName, String otp, int ttlMinutes) {
        String subject = "You've been added to Gatherly — your sign-in code";
        String validity = ttlMinutes >= 120 ? (ttlMinutes / 60) + " hours" : ttlMinutes + " minutes";
        String html = """
                <p>Hi %s,</p>
                <p>An administrator created a Gatherly account for you (%s).</p>
                <p>Sign in with your email and this one-time code, then choose your password:</p>
                <p style="font-size:24px;font-weight:bold;letter-spacing:4px">%s</p>
                <p>This code expires in %s.</p>
                <p>— Gatherly</p>
                """.formatted(escape(fullName), escape(toEmail), otp, validity);

        if (!enabled) {
            log.warn("EMAIL disabled — invite code for {} is {} (valid {})", toEmail, otp, validity);
            return;
        }
        send(toEmail, subject, html);
    }

    public void sendOtp(String toEmail, String fullName, String otp, int ttlMinutes) {
        String subject = "Your Gatherly password-reset code";
        String html = """
                <p>Hi %s,</p>
                <p>Your password-reset code is:</p>
                <p style="font-size:24px;font-weight:bold;letter-spacing:4px">%s</p>
                <p>This code expires in %d minutes. If you didn't request it, you can ignore this email.</p>
                <p>— Gatherly</p>
                """.formatted(escape(fullName), otp, ttlMinutes);

        if (!enabled) {
            // Dev/test convenience only: no SMTP configured, so surface the code in logs.
            log.warn("EMAIL disabled — OTP for {} is {} (valid {}m)", toEmail, otp, ttlMinutes);
            return;
        }
        send(toEmail, subject, html);
    }

    /**
     * Deliver a guest their personal QR ticket (docs/04 §2.1). The QR PNG is embedded inline (CID)
     * so it renders without an external fetch. Returns {@code true} only if the message was actually
     * sent — the caller uses that to flip {@code qr_status PENDING → DELIVERED}. When email is
     * disabled (local/test) or the send fails, returns {@code false} and the ticket stays PENDING
     * for the retry sweep + on-screen fallback (docs/06 §7).
     */
    public boolean sendQrTicket(String toEmail, String guestName, String eventTitle, String eventWhen,
                                String venue, String ticketLink, byte[] qrPng) {
        String subject = "Your QR ticket — " + (eventTitle == null ? "Gatherly event" : eventTitle);
        String details = java.util.stream.Stream.of(eventWhen, venue)
                .filter(s -> s != null && !s.isBlank()).map(EmailService::escape)
                .reduce((a, b) -> a + " · " + b).map(s -> " (" + s + ")").orElse("");
        String html = """
                <p>Hi %s,</p>
                <p>You're registered for <b>%s</b>%s.</p>
                <p>Show this QR at the entrance — an organizer will scan it to confirm your attendance.</p>
                <p><img src="cid:qr-ticket" alt="Your QR ticket" width="240" height="240"></p>
                <p>Can't see the image? View your ticket:<br><a href="%s">%s</a></p>
                <p>— Gatherly</p>
                """.formatted(escape(guestName == null || guestName.isBlank() ? "there" : guestName),
                escape(eventTitle == null ? "your event" : eventTitle), details, ticketLink, ticketLink);

        if (!enabled) {
            log.warn("EMAIL disabled — QR ticket for {} not sent; ticket link is {}", toEmail, ticketLink);
            return false;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8"); // multipart
            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            helper.addInline("qr-ticket", new ByteArrayResource(qrPng), "image/png");
            mailSender.send(message);
            log.info("Sent QR ticket to {} (event='{}')", toEmail, eventTitle);
            return true;
        } catch (Exception ex) {
            // Never fail/rollback the registration on a mail problem; the sweep retries (docs/06 §7).
            log.error("Failed to send QR ticket to {}: {}", toEmail, ex.getMessage());
            return false;
        }
    }

    private void send(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Sent email to {} (subject='{}')", to, subject);
        } catch (Exception ex) {
            // Never surface mail failures to the caller (no account enumeration for OTP).
            log.error("Failed to send email to {} (subject='{}'): {}", to, subject, ex.getMessage());
        }
    }

    private static String escape(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
