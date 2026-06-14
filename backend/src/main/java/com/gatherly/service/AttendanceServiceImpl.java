package com.gatherly.service;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.CheckinSource;
import com.gatherly.domain.Event;
import com.gatherly.domain.EventCheckin;
import com.gatherly.domain.RegistrationSubmission;
import com.gatherly.domain.TicketStatus;
import com.gatherly.dto.attendance.AttendanceSummary;
import com.gatherly.dto.attendance.CheckinResponse;
import com.gatherly.dto.attendance.ManualCheckinRequest;
import com.gatherly.dto.attendance.ScanRequest;
import com.gatherly.dto.attendance.SubmissionSummary;
import com.gatherly.repository.EventCheckinRepository;
import com.gatherly.repository.EventRepository;
import com.gatherly.repository.RegistrationSubmissionRepository;
import com.gatherly.security.UserPrincipal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * {@link AttendanceService} implementation ({@code docs/06} §4). Idempotency is guaranteed by the
 * {@code UNIQUE(event_checkin.submission_id)} constraint, not application checks alone: two
 * concurrent scans can't both succeed — the loser maps to {@code 409 ALREADY_CHECKED_IN}. Scanning
 * is gated by {@code canView} (any assigned staff); override/revoke by {@code canManage}.
 */
@Service
public class AttendanceServiceImpl implements AttendanceService {

  private final RegistrationSubmissionRepository submissionRepository;
  private final EventCheckinRepository checkinRepository;
  private final EventRepository eventRepository;
  private final OpsNotificationService opsNotificationService;

  public AttendanceServiceImpl(
      RegistrationSubmissionRepository submissionRepository,
      EventCheckinRepository checkinRepository,
      EventRepository eventRepository,
      OpsNotificationService opsNotificationService) {
    this.submissionRepository = submissionRepository;
    this.checkinRepository = checkinRepository;
    this.eventRepository = eventRepository;
    this.opsNotificationService = opsNotificationService;
  }

  @Override
  @PreAuthorize("@eventSecurity.canView(#eventId, authentication)")
  @Transactional
  public CheckinResponse scan(UUID eventId, ScanRequest request, UserPrincipal principal) {
    RegistrationSubmission submission =
        submissionRepository
            .findByCheckinToken(request.checkinToken())
            .filter(s -> s.getEventId().equals(eventId))
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Ticket not found."));
    if (!withinCheckinWindow(eventId)) {
      throw new ApiException(ErrorCode.TICKET_INVALID, "The check-in window is not open.");
    }
    return confirm(submission, principal, CheckinSource.QR_SCAN);
  }

  @Override
  @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
  @Transactional
  public CheckinResponse manualCheckin(
      UUID eventId, ManualCheckinRequest request, UserPrincipal principal) {
    RegistrationSubmission submission =
        submissionRepository
            .findById(request.submissionId())
            .filter(s -> s.getEventId().equals(eventId))
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Registration not found."));
    return confirm(submission, principal, CheckinSource.MANUAL);
  }

  @Override
  @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
  @Transactional
  public void revoke(UUID eventId, UUID submissionId) {
    RegistrationSubmission submission =
        submissionRepository
            .findById(submissionId)
            .filter(s -> s.getEventId().equals(eventId))
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Registration not found."));
    if (submission.getQrStatus() == TicketStatus.CHECKED_IN) {
      throw new ApiException(ErrorCode.CONFLICT, "A checked-in ticket cannot be revoked.");
    }
    submission.setQrStatus(TicketStatus.REVOKED);
  }

  @Override
  @PreAuthorize("@eventSecurity.canView(#eventId, authentication)")
  @Transactional(readOnly = true)
  public AttendanceSummary attendance(UUID eventId) {
    List<CheckinResponse> checkins =
        checkinRepository.findByEventIdOrderByCheckedInAtDesc(eventId).stream()
            .map(AttendanceServiceImpl::toResponse)
            .toList();
    return new AttendanceSummary(
        eventId, submissionRepository.countByEventId(eventId), checkins.size(), checkins);
  }

  @Override
  @PreAuthorize("@eventSecurity.canView(#eventId, authentication)")
  @Transactional(readOnly = true)
  public Page<SubmissionSummary> submissions(UUID eventId, String search, Pageable pageable) {
    String q = (search == null || search.isBlank()) ? null : search.trim();
    return submissionRepository
        .search(eventId, q, pageable)
        .map(
            s ->
                new SubmissionSummary(
                    s.getId(),
                    s.getGuestName(),
                    s.getGuestEmail(),
                    s.getGuestPhone(),
                    s.getQrStatus(),
                    s.getSubmittedAt()));
  }

  /** Shared confirm path: reject revoked, guard re-check-in, rely on the unique constraint. */
  private CheckinResponse confirm(
      RegistrationSubmission submission, UserPrincipal principal, CheckinSource source) {
    if (submission.getQrStatus() == TicketStatus.REVOKED) {
      throw new ApiException(ErrorCode.TICKET_INVALID, "This ticket has been revoked.");
    }
    checkinRepository
        .findBySubmissionId(submission.getId())
        .ifPresent(
            existing -> {
              throw alreadyCheckedIn(existing.getCheckedInAt());
            });

    EventCheckin checkin = new EventCheckin();
    checkin.setEventId(submission.getEventId());
    checkin.setSubmissionId(submission.getId());
    checkin.setGuestPhone(submission.getGuestPhone());
    checkin.setGuestName(submission.getGuestName());
    checkin.setScannedBy(principal.id());
    checkin.setSource(source);
    checkin.setCheckedInAt(Instant.now());
    try {
      checkinRepository.saveAndFlush(checkin);
    } catch (DataIntegrityViolationException race) {
      throw alreadyCheckedIn(null); // concurrent scan won the unique constraint
    }
    submission.setQrStatus(TicketStatus.CHECKED_IN);
    // After commit: push the confirmed check-in to the Telegram ops channel (best-effort, retried).
    UUID checkinId = checkin.getId();
    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronization() {
          @Override
          public void afterCommit() {
            opsNotificationService.pushCheckin(checkinId);
          }
        });
    return toResponse(checkin);
  }

  private boolean withinCheckinWindow(UUID eventId) {
    Event event =
        eventRepository
            .findById(eventId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Event not found."));
    return event.getCheckinOpensAt() == null || !Instant.now().isBefore(event.getCheckinOpensAt());
  }

  private static ApiException alreadyCheckedIn(Instant at) {
    String when = at == null ? "already" : "at " + at;
    return new ApiException(ErrorCode.ALREADY_CHECKED_IN, "Guest already checked in " + when + ".");
  }

  private static CheckinResponse toResponse(EventCheckin c) {
    return new CheckinResponse(
        c.getId(),
        c.getSubmissionId(),
        c.getGuestName(),
        c.getGuestPhone(),
        c.getScannedBy(),
        c.getSource(),
        c.getCheckedInAt());
  }
}
