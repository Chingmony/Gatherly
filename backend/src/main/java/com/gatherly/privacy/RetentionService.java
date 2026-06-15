package com.gatherly.privacy;

import com.gatherly.registration.RegistrationSubmissionRepository;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/**
 * Submission/check-in retention purge (docs/10 §7 — decided: 90 days post-event, then purge). A
 * daily job removes submissions for events that ended more than {@code retentionDays} ago; the DB
 * {@code ON DELETE CASCADE} takes their check-ins with them. ShedLock single-fires it across
 * instances; the delete is idempotent (already-purged rows simply don't match).
 */
@Service
public class RetentionService {

    private static final Logger log = LoggerFactory.getLogger(RetentionService.class);

    private final RegistrationSubmissionRepository submissions;
    private final long retentionDays;

    public RetentionService(RegistrationSubmissionRepository submissions,
                            @Value("${gatherly.retention.submission-days:90}") long retentionDays) {
        this.submissions = submissions;
        this.retentionDays = retentionDays;
    }

    @Scheduled(cron = "${gatherly.retention.cron:0 30 3 * * *}") // daily 03:30
    @SchedulerLock(name = "retentionPurge", lockAtMostFor = "PT30M", lockAtLeastFor = "PT1M")
    @Transactional
    public void purge() {
        Instant cutoff = Instant.now().minus(Duration.ofDays(retentionDays));
        int removed = submissions.deleteForEventsEndedBefore(cutoff);
        if (removed > 0) {
            log.info("Retention purge removed {} submissions for events ended before {} ({}d window)",
                    removed, cutoff, retentionDays);
        }
    }
}
