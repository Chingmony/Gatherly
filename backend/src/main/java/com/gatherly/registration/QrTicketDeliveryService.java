package com.gatherly.registration;

import com.gatherly.common.error.DomainConflictException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.error.NotFoundException;
import com.gatherly.event.EventRepository;
import com.gatherly.event.domain.Event;
import com.gatherly.integration.email.EmailService;
import com.gatherly.integration.qr.QrService;
import com.gatherly.registration.domain.RegistrationSubmission;
import com.gatherly.registration.domain.TicketStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Renders + emails a guest's QR ticket and advances the ticket lifecycle (docs/02 §5b, docs/06 §6).
 * Shared by the after-commit listener (initial send), the on-demand resend endpoint, and the retry
 * sweep (docs/06 §7). Each call runs in its own transaction — it is invoked <b>after</b> the
 * registration commit, never inside it, so mail latency/failure can't roll back the registration.
 */
@Service
public class QrTicketDeliveryService {

    private static final DateTimeFormatter WHEN =
            DateTimeFormatter.ofPattern("MMM d, yyyy").withZone(ZoneOffset.UTC);

    private final RegistrationSubmissionRepository submissions;
    private final EventRepository events;
    private final QrService qr;
    private final EmailService email;
    private final String publicBaseUrl;

    public QrTicketDeliveryService(RegistrationSubmissionRepository submissions, EventRepository events,
                                   QrService qr, EmailService email,
                                   @Value("${gatherly.app.public-base-url:http://localhost:3000}") String publicBaseUrl) {
        this.submissions = submissions;
        this.events = events;
        this.qr = qr;
        this.email = email;
        this.publicBaseUrl = publicBaseUrl.replaceAll("/$", "");
    }

    /**
     * Initial / sweep delivery: send only while the ticket is still {@code PENDING} (idempotent — a
     * DELIVERED/CHECKED_IN/REVOKED ticket is skipped). Returns whether the email was sent.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean deliver(UUID submissionId) {
        RegistrationSubmission sub = submissions.findById(submissionId).orElse(null);
        if (sub == null || sub.getQrStatus() != TicketStatus.PENDING) {
            return false;
        }
        return sendAndMark(sub);
    }

    /**
     * On-demand resend for the public ticket page (docs/03 §4.9). Allowed while the ticket is still
     * usable ({@code PENDING}/{@code DELIVERED}); a checked-in or revoked ticket can't be re-sent.
     */
    @Transactional
    public boolean resend(String checkinToken) {
        RegistrationSubmission sub = submissions.findByCheckinToken(checkinToken)
                .orElseThrow(() -> new NotFoundException("Ticket not found."));
        if (sub.getQrStatus() == TicketStatus.CHECKED_IN || sub.getQrStatus() == TicketStatus.REVOKED) {
            throw new DomainConflictException(ErrorCode.CONFLICT,
                    "This ticket can no longer be re-sent.");
        }
        return sendAndMark(sub);
    }

    private boolean sendAndMark(RegistrationSubmission sub) {
        Event event = events.findById(sub.getEventId()).orElse(null);
        String title = event == null ? null : event.getTitle();
        String venue = event == null ? null : event.getVenue();
        String when = event == null || event.getStartsAt() == null ? null : WHEN.format(event.getStartsAt());
        String link = publicBaseUrl + "/tickets/" + sub.getCheckinToken();
        byte[] png = qr.renderPng(sub.getCheckinToken());

        boolean sent = email.sendQrTicket(sub.getGuestEmail(), sub.getGuestName(), title, when, venue, link, png);
        if (sent && sub.getQrStatus() == TicketStatus.PENDING) {
            sub.setQrStatus(TicketStatus.DELIVERED);
            sub.setQrDeliveredAt(Instant.now());
            submissions.save(sub);
        }
        return sent;
    }
}
