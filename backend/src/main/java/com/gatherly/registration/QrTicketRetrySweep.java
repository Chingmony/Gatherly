package com.gatherly.registration;

import com.gatherly.registration.domain.RegistrationSubmission;
import com.gatherly.registration.domain.TicketStatus;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * Re-sends QR tickets stuck in {@code PENDING} past a grace window (docs/06 §7) — covers transient
 * mail failures so a guest still gets their ticket without manual intervention. Idempotent: it only
 * acts on {@code PENDING} rows and {@link QrTicketDeliveryService#deliver} re-checks status under
 * its own transaction, so a double-run (or a concurrent initial send) can't double-deliver. Bounded
 * batch so it never scans unbounded. No-op when email is disabled.
 */
@Component
public class QrTicketRetrySweep {

    private static final Logger log = LoggerFactory.getLogger(QrTicketRetrySweep.class);

    private final RegistrationSubmissionRepository submissions;
    private final QrTicketDeliveryService delivery;
    private final boolean emailEnabled;
    private final long graceSeconds;
    private final int batchSize;

    public QrTicketRetrySweep(RegistrationSubmissionRepository submissions, QrTicketDeliveryService delivery,
                              @Value("${gatherly.email.enabled:false}") boolean emailEnabled,
                              @Value("${gatherly.qr-retry.grace-seconds:120}") long graceSeconds,
                              @Value("${gatherly.qr-retry.batch-size:100}") int batchSize) {
        this.submissions = submissions;
        this.delivery = delivery;
        this.emailEnabled = emailEnabled;
        this.graceSeconds = graceSeconds;
        this.batchSize = batchSize;
    }

    @Scheduled(fixedDelayString = "${gatherly.qr-retry.interval-ms:90000}",
            initialDelayString = "${gatherly.qr-retry.interval-ms:90000}")
    @SchedulerLock(name = "qrTicketRetrySweep", lockAtMostFor = "PT5M", lockAtLeastFor = "PT10S")
    public void sweep() {
        if (!emailEnabled) {
            return; // nothing can be delivered with email disabled (local/test)
        }
        Instant cutoff = Instant.now().minusSeconds(graceSeconds);
        List<RegistrationSubmission> stale = submissions
                .findByQrStatusAndSubmittedAtBeforeOrderBySubmittedAtAsc(
                        TicketStatus.PENDING, cutoff, PageRequest.of(0, batchSize));
        if (stale.isEmpty()) {
            return;
        }
        int sent = 0;
        for (RegistrationSubmission s : stale) {
            if (delivery.deliver(s.getId())) {
                sent++;
            }
        }
        log.info("QR retry sweep: {} pending past grace, {} delivered", stale.size(), sent);
    }
}
