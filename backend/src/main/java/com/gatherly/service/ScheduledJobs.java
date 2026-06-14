package com.gatherly.service;

import com.gatherly.domain.TicketStatus;
import com.gatherly.repository.EventCheckinRepository;
import com.gatherly.repository.RefreshTokenRepository;
import com.gatherly.repository.RegistrationSubmissionRepository;
import java.time.Instant;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Idempotent maintenance jobs ({@code docs/06} §7), each guarded by ShedLock so only one instance
 * runs it. Gated by {@code app.scheduling.enabled}. The sweeps re-drive after-commit side effects
 * that failed transiently; cleanup prunes dead refresh tokens.
 */
@Component
@ConditionalOnProperty(name = "app.scheduling.enabled", havingValue = "true", matchIfMissing = true)
public class ScheduledJobs {

  private static final Logger log = LoggerFactory.getLogger(ScheduledJobs.class);

  private final EventCheckinRepository checkinRepository;
  private final RegistrationSubmissionRepository submissionRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final OpsNotificationService opsNotificationService;
  private final QrTicketDispatcher qrTicketDispatcher;

  public ScheduledJobs(
      EventCheckinRepository checkinRepository,
      RegistrationSubmissionRepository submissionRepository,
      RefreshTokenRepository refreshTokenRepository,
      OpsNotificationService opsNotificationService,
      QrTicketDispatcher qrTicketDispatcher) {
    this.checkinRepository = checkinRepository;
    this.submissionRepository = submissionRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.opsNotificationService = opsNotificationService;
    this.qrTicketDispatcher = qrTicketDispatcher;
  }

  /** Re-push check-ins whose ops-channel notification never landed. */
  @Scheduled(fixedDelayString = "PT90S")
  @SchedulerLock(name = "telegramRetrySweep", lockAtMostFor = "PT2M", lockAtLeastFor = "PT5S")
  public void telegramRetrySweep() {
    var pending = checkinRepository.findTop50ByTelegramNotifiedFalseOrderByCheckedInAtAsc();
    if (!pending.isEmpty()) {
      log.info("Telegram retry sweep: {} check-in(s)", pending.size());
      pending.forEach(c -> opsNotificationService.pushCheckin(c.getId()));
    }
  }

  /** Re-send QR tickets stuck in PENDING (transient mail failure). */
  @Scheduled(fixedDelayString = "PT90S")
  @SchedulerLock(name = "qrEmailRetrySweep", lockAtMostFor = "PT2M", lockAtLeastFor = "PT5S")
  public void qrEmailRetrySweep() {
    var pending =
        submissionRepository.findTop50ByQrStatusOrderBySubmittedAtAsc(TicketStatus.PENDING);
    if (!pending.isEmpty()) {
      log.info("QR-email retry sweep: {} ticket(s)", pending.size());
      pending.forEach(s -> qrTicketDispatcher.dispatch(s.getId()));
    }
  }

  /** Prune expired/revoked refresh tokens. */
  @Scheduled(cron = "0 0 * * * *")
  @SchedulerLock(name = "refreshTokenCleanup", lockAtMostFor = "PT5M")
  @Transactional
  public void refreshTokenCleanup() {
    int removed = refreshTokenRepository.deleteExpiredOrRevoked(Instant.now());
    if (removed > 0) {
      log.info("Refresh-token cleanup: removed {} row(s)", removed);
    }
  }
}
