package com.gatherly.integration.email;

import com.gatherly.config.EmailProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

/**
 * Transactional email via {@code JavaMailSender} + Thymeleaf ({@code docs/04} §2.1). One
 * integration serves both OTP and (later) QR tickets. When {@code app.email.enabled=false} the
 * message is logged instead of sent (local/test). Failures are logged, never surfaced to the
 * caller.
 */
@Service
public class EmailService {

  private static final Logger log = LoggerFactory.getLogger(EmailService.class);

  private final JavaMailSender mailSender;
  private final SpringTemplateEngine templateEngine;
  private final EmailProperties props;

  public EmailService(
      JavaMailSender mailSender, SpringTemplateEngine templateEngine, EmailProperties props) {
    this.mailSender = mailSender;
    this.templateEngine = templateEngine;
    this.props = props;
  }

  /**
   * Send a password-reset OTP. Runs off the request thread so a slow SMTP never blocks the user.
   */
  @Async("sideEffectExecutor")
  public void sendOtp(String toEmail, String fullName, String otp, int ttlMinutes) {
    if (!props.enabled()) {
      log.info("[email disabled] OTP for {} = {} (valid {} min)", toEmail, otp, ttlMinutes);
      return;
    }
    Context ctx = new Context();
    ctx.setVariable("fullName", fullName);
    ctx.setVariable("otp", otp);
    ctx.setVariable("ttlMinutes", ttlMinutes);
    String html = templateEngine.process("email/otp", ctx);
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
      helper.setFrom(props.fromAddress(), props.fromName());
      helper.setTo(toEmail);
      helper.setSubject("Your Gatherly password-reset code");
      helper.setText(html, true);
      mailSender.send(message);
      log.info("OTP email sent to {}", toEmail);
    } catch (MessagingException | UnsupportedEncodingException | RuntimeException ex) {
      log.error("Failed to send OTP email to {}", toEmail, ex);
    }
  }

  /**
   * Send a QR-ticket email with the QR PNG embedded inline (CID). Returns true on success so the
   * caller can flip the ticket to {@code DELIVERED}. Called after commit by {@link
   * com.gatherly.service.QrTicketDispatcher}; never throws.
   */
  public boolean sendQrTicket(QrTicketEmail email) {
    if (!props.enabled()) {
      log.info("[email disabled] QR ticket for {} not sent", email.toEmail());
      return false;
    }
    Context ctx = new Context();
    ctx.setVariable("guestName", email.guestName());
    ctx.setVariable("eventTitle", email.eventTitle());
    ctx.setVariable("eventWhen", email.eventWhen());
    ctx.setVariable("venue", email.venue());
    ctx.setVariable("ticketUrl", email.ticketUrl());
    String html = templateEngine.process("email/qr-ticket", ctx);
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
      helper.setFrom(props.fromAddress(), props.fromName());
      helper.setTo(email.toEmail());
      helper.setSubject("Your QR ticket — " + email.eventTitle());
      helper.setText(html, true);
      helper.addInline("qr", new ByteArrayResource(email.qrPng()), "image/png");
      mailSender.send(message);
      log.info("QR ticket email sent to {}", email.toEmail());
      return true;
    } catch (MessagingException | UnsupportedEncodingException | RuntimeException ex) {
      log.error("Failed to send QR ticket email to {}", email.toEmail(), ex);
      return false;
    }
  }
}
