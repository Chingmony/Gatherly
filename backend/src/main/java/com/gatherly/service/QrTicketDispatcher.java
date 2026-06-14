package com.gatherly.service;

import com.gatherly.domain.Event;
import com.gatherly.domain.RegistrationSubmission;
import com.gatherly.domain.TicketStatus;
import com.gatherly.integration.email.EmailService;
import com.gatherly.integration.email.QrTicketEmail;
import com.gatherly.integration.qr.QrService;
import com.gatherly.repository.EventRepository;
import com.gatherly.repository.RegistrationSubmissionRepository;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Renders the QR PNG and emails the ticket, then flips the ticket to {@code DELIVERED}. Runs on the
 * side-effect executor <em>after the registration transaction commits</em> ({@code docs/06} §6) so
 * a slow/failed mail server never blocks or rolls back the guest's registration. A transient
 * failure leaves the ticket {@code PENDING} for the M9 retry sweep; the on-screen ticket page still
 * shows the QR.
 */
@Service
public class QrTicketDispatcher {

  private static final Logger log = LoggerFactory.getLogger(QrTicketDispatcher.class);
  private static final int QR_SIZE_PX = 300;

  private final RegistrationSubmissionRepository submissionRepository;
  private final EventRepository eventRepository;
  private final QrService qrService;
  private final EmailService emailService;
  private final String publicBaseUrl;

  public QrTicketDispatcher(
      RegistrationSubmissionRepository submissionRepository,
      EventRepository eventRepository,
      QrService qrService,
      EmailService emailService,
      @Value("${app.public-base-url:http://localhost:3000}") String publicBaseUrl) {
    this.submissionRepository = submissionRepository;
    this.eventRepository = eventRepository;
    this.qrService = qrService;
    this.emailService = emailService;
    this.publicBaseUrl = publicBaseUrl;
  }

  @Async("sideEffectExecutor")
  @Transactional
  public void dispatch(UUID submissionId) {
    RegistrationSubmission submission = submissionRepository.findById(submissionId).orElse(null);
    if (submission == null
        || submission.getQrStatus() == TicketStatus.CHECKED_IN
        || submission.getQrStatus() == TicketStatus.REVOKED) {
      return;
    }
    Event event = eventRepository.findById(submission.getEventId()).orElse(null);
    byte[] png = qrService.renderPng(submission.getCheckinToken(), QR_SIZE_PX);
    QrTicketEmail email =
        new QrTicketEmail(
            submission.getGuestEmail(),
            submission.getGuestName() == null ? "there" : submission.getGuestName(),
            event == null ? "your event" : event.getTitle(),
            event == null || event.getStartsAt() == null ? "" : event.getStartsAt().toString(),
            event == null ? null : event.getVenue(),
            ticketUrl(submission.getCheckinToken()),
            png);
    if (emailService.sendQrTicket(email)) {
      submission.setQrStatus(TicketStatus.DELIVERED);
      submission.setQrDeliveredAt(Instant.now());
    } else {
      log.info("QR ticket for {} left PENDING (email not delivered)", submission.getGuestEmail());
    }
  }

  public String ticketUrl(String checkinToken) {
    return publicBaseUrl.replaceAll("/+$", "") + "/tickets/" + checkinToken;
  }
}
