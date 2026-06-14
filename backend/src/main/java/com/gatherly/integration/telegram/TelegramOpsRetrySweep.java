package com.gatherly.integration.telegram;

import com.gatherly.attendance.EventCheckinRepository;
import com.gatherly.attendance.domain.EventCheckin;
import com.gatherly.registration.RegistrationSubmissionRepository;
import com.gatherly.registration.domain.RegistrationSubmission;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * Re-pushes ops-channel messages for rows still {@code telegram_notified=false} past a grace window
 * (docs/04 §2.2, docs/06 §7) — covers transient Telegram failures so the ops feed self-heals without
 * manual intervention. The grace window lets the after-commit immediate push go first; the sweep only
 * mops up what failed. Idempotent ({@link TelegramOpsService} re-checks the flag under its own
 * {@code REQUIRES_NEW} transaction) and bounded (paged batch), so a double-run can't double-post.
 * No-op when Telegram is disabled (local/test/CI).
 */
@Component
public class TelegramOpsRetrySweep {

    private static final Logger log = LoggerFactory.getLogger(TelegramOpsRetrySweep.class);

    private final RegistrationSubmissionRepository submissions;
    private final EventCheckinRepository checkins;
    private final TelegramOpsService ops;
    private final boolean enabled;
    private final long graceSeconds;
    private final int batchSize;

    public TelegramOpsRetrySweep(RegistrationSubmissionRepository submissions, EventCheckinRepository checkins,
                                 TelegramOpsService ops,
                                 @Value("${gatherly.telegram.enabled:false}") boolean enabled,
                                 @Value("${gatherly.ops-retry.grace-seconds:120}") long graceSeconds,
                                 @Value("${gatherly.ops-retry.batch-size:100}") int batchSize) {
        this.submissions = submissions;
        this.checkins = checkins;
        this.ops = ops;
        this.enabled = enabled;
        this.graceSeconds = graceSeconds;
        this.batchSize = batchSize;
    }

    @Scheduled(fixedDelayString = "${gatherly.ops-retry.interval-ms:90000}",
            initialDelayString = "${gatherly.ops-retry.interval-ms:90000}")
    public void sweep() {
        if (!enabled) {
            return; // nothing can be forwarded with Telegram disabled (local/test)
        }
        Instant cutoff = Instant.now().minusSeconds(graceSeconds);
        PageRequest page = PageRequest.of(0, batchSize);

        List<RegistrationSubmission> staleRegs = submissions
                .findByTelegramNotifiedFalseAndSubmittedAtBeforeOrderBySubmittedAtAsc(cutoff, page);
        int regsSent = 0;
        for (RegistrationSubmission s : staleRegs) {
            if (ops.forwardRegistration(s.getId())) {
                regsSent++;
            }
        }

        List<EventCheckin> staleCheckins = checkins
                .findByTelegramNotifiedFalseAndCheckedInAtBeforeOrderByCheckedInAtAsc(cutoff, page);
        int checkinsSent = 0;
        for (EventCheckin c : staleCheckins) {
            if (ops.forwardCheckin(c.getId())) {
                checkinsSent++;
            }
        }

        if (!staleRegs.isEmpty() || !staleCheckins.isEmpty()) {
            log.info("Telegram ops sweep: registrations {}/{} pushed, check-ins {}/{} pushed",
                    regsSent, staleRegs.size(), checkinsSent, staleCheckins.size());
        }
    }
}
