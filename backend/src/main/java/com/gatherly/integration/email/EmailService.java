package com.gatherly.integration.email;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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
