package com.gatherly.service;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.Event;
import com.gatherly.domain.EventCheckin;
import com.gatherly.domain.RegistrationSubmission;
import com.gatherly.integration.telegram.TelegramNotifier;
import com.gatherly.repository.EventCheckinRepository;
import com.gatherly.repository.EventRepository;
import com.gatherly.repository.RegistrationSubmissionRepository;
import com.gatherly.repository.UserRepository;
import java.util.UUID;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link OpsNotificationService} implementation. {@link #pushCheckin} runs on the side-effect
 * executor after the attendance transaction commits ({@code docs/06} §2) and is idempotent — it
 * skips rows already {@code telegram_notified}, so it doubles as the retry-sweep worker.
 */
@Service
public class OpsNotificationServiceImpl implements OpsNotificationService {

  private final EventCheckinRepository checkinRepository;
  private final RegistrationSubmissionRepository submissionRepository;
  private final EventRepository eventRepository;
  private final UserRepository userRepository;
  private final TelegramNotifier telegramNotifier;

  public OpsNotificationServiceImpl(
      EventCheckinRepository checkinRepository,
      RegistrationSubmissionRepository submissionRepository,
      EventRepository eventRepository,
      UserRepository userRepository,
      TelegramNotifier telegramNotifier) {
    this.checkinRepository = checkinRepository;
    this.submissionRepository = submissionRepository;
    this.eventRepository = eventRepository;
    this.userRepository = userRepository;
    this.telegramNotifier = telegramNotifier;
  }

  @Override
  @Async("sideEffectExecutor")
  @Transactional
  public void pushCheckin(UUID checkinId) {
    EventCheckin checkin = checkinRepository.findById(checkinId).orElse(null);
    if (checkin == null || checkin.isTelegramNotified()) {
      return;
    }
    String eventTitle =
        eventRepository.findById(checkin.getEventId()).map(Event::getTitle).orElse("your event");
    String scannedBy =
        userRepository.findById(checkin.getScannedBy()).map(u -> u.getFullName()).orElse(null);
    String text =
        TelegramNotifier.checkinText(
            eventTitle,
            checkin.getGuestName(),
            checkin.getGuestPhone(),
            checkin.getCheckedInAt(),
            scannedBy);
    if (telegramNotifier.send(text)) {
      checkin.setTelegramNotified(true);
    }
  }

  @Override
  @Async("sideEffectExecutor")
  @Transactional(readOnly = true)
  public void pushRegistration(UUID submissionId) {
    RegistrationSubmission submission = submissionRepository.findById(submissionId).orElse(null);
    if (submission == null) {
      return;
    }
    String eventTitle =
        eventRepository.findById(submission.getEventId()).map(Event::getTitle).orElse("your event");
    telegramNotifier.send(
        TelegramNotifier.registeredText(
            eventTitle, submission.getGuestName(), submission.getGuestPhone()));
  }

  @Override
  @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
  @Transactional(readOnly = true)
  public boolean sendTest(UUID eventId) {
    Event event =
        eventRepository
            .findById(eventId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Event not found."));
    return telegramNotifier.send(TelegramNotifier.testText(event.getTitle()));
  }
}
