package com.gatherly.attendance;

import com.gatherly.attendance.domain.CheckinSource;
import com.gatherly.attendance.domain.EventCheckin;
import com.gatherly.attendance.dto.AttendanceRecord;
import com.gatherly.attendance.dto.AttendanceResponse;
import com.gatherly.attendance.dto.CheckinResult;
import com.gatherly.attendance.dto.ManualCheckinRequest;
import com.gatherly.attendance.dto.ScanRequest;
import com.gatherly.attendance.event.GuestCheckedInEvent;
import com.gatherly.audit.AuditService;
import com.gatherly.common.error.DomainConflictException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.error.NotFoundException;
import com.gatherly.event.EventRepository;
import com.gatherly.event.domain.Event;
import com.gatherly.registration.RegistrationSubmissionRepository;
import com.gatherly.registration.domain.RegistrationSubmission;
import com.gatherly.registration.domain.TicketStatus;
import com.gatherly.security.UserPrincipal;
import com.gatherly.user.UserRepository;
import com.gatherly.user.domain.User;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Attendance — the organizer scan (docs/06 §4, docs/03 §4.10). Confirming attendance is an
 * authenticated organizer control: a guest can never self-check-in. Idempotency is guaranteed by the
 * {@code UNIQUE(event_checkin.submission_id)} constraint (docs/02 §3.11), not application checks
 * alone — two simultaneous door-rush scans can't both insert; the loser maps to
 * {@code 409 ALREADY_CHECKED_IN}.
 *
 * <p>Authorization (docs/03 §4.10): scanning is open to any assigned staff
 * ({@code @eventSecurity.canView}); manual override + revoke are manager-gated
 * ({@code @eventSecurity.canManage}).
 */
@Service
@Transactional
public class AttendanceService {

    private static final int LIVE_FEED_CAP = 100;

    private final EventRepository events;
    private final RegistrationSubmissionRepository submissions;
    private final EventCheckinRepository checkins;
    private final UserRepository users;
    private final ApplicationEventPublisher eventPublisher;
    private final AuditService auditService;

    public AttendanceService(EventRepository events, RegistrationSubmissionRepository submissions,
                             EventCheckinRepository checkins, UserRepository users,
                             ApplicationEventPublisher eventPublisher, AuditService auditService) {
        this.events = events;
        this.submissions = submissions;
        this.checkins = checkins;
        this.users = users;
        this.eventPublisher = eventPublisher;
        this.auditService = auditService;
    }

    /**
     * Organizer scans a guest QR (docs/06 §4). Resolves the token → submission, verifies it belongs
     * to {@code eventId} (404, no cross-event leak), is not revoked, and the check-in window is open;
     * then creates the 1:1 {@code event_checkin} and flips the ticket {@code → CHECKED_IN}.
     */
    @PreAuthorize("@eventSecurity.canView(#eventId, authentication)")
    public CheckinResult scan(UUID eventId, ScanRequest req, UserPrincipal scanner) {
        RegistrationSubmission sub = submissions.findByCheckinToken(req.checkinToken())
                .orElseThrow(() -> new NotFoundException("Ticket not found.")); // unknown token → 404
        return confirm(eventId, sub, scanner, CheckinSource.QR_SCAN);
    }

    /**
     * Manual staff override without a QR (docs/03 §4.10) — manager-gated. Same invariants as
     * {@link #scan}, recorded with {@code source = MANUAL}.
     */
    @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
    public CheckinResult manual(UUID eventId, ManualCheckinRequest req, UserPrincipal scanner) {
        RegistrationSubmission sub = submissions.findById(req.submissionId())
                .orElseThrow(() -> new NotFoundException("Registration not found."));
        return confirm(eventId, sub, scanner, CheckinSource.MANUAL);
    }

    /**
     * Invalidate a ticket (docs/02 §5b, docs/03 §4.10) — manager-gated. A non-terminal ticket
     * ({@code PENDING}/{@code DELIVERED}) moves to {@code REVOKED} so later scans are rejected; a
     * ticket already {@code CHECKED_IN} can't be revoked; a re-revoke is an idempotent no-op.
     */
    @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
    public void revoke(UUID eventId, UUID submissionId, UserPrincipal actor) {
        RegistrationSubmission sub = submissions.findById(submissionId)
                .filter(s -> s.getEventId().equals(eventId))
                .orElseThrow(() -> new NotFoundException("Ticket not found.")); // no cross-event leak
        if (sub.getQrStatus() == TicketStatus.CHECKED_IN) {
            throw new DomainConflictException(ErrorCode.CONFLICT,
                    "This guest has already checked in and can no longer be revoked.");
        }
        if (sub.getQrStatus() == TicketStatus.REVOKED) {
            return; // idempotent
        }
        sub.setQrStatus(TicketStatus.REVOKED);
        // Revoke-actor audit trail (docs/10 §audit, V13) — who revoked and when.
        sub.setRevokedBy(actor == null ? null : actor.id());
        sub.setRevokedAt(Instant.now());
        submissions.save(sub);
        auditService.record("TICKET_REVOKED", "SUBMISSION", submissionId, "event=" + eventId);
    }

    /** Live attendance list + counts (docs/03 §4.10), bounded most-recent-first; no N+1. */
    @PreAuthorize("@eventSecurity.canView(#eventId, authentication)")
    @Transactional(readOnly = true)
    public AttendanceResponse liveAttendance(UUID eventId) {
        if (!events.existsById(eventId)) {
            throw new NotFoundException("Event not found.");
        }
        long registered = submissions.countByEventId(eventId);
        long checkedIn = checkins.countByEventId(eventId);
        List<EventCheckin> rows =
                checkins.findByEventIdOrderByCheckedInAtDesc(eventId, PageRequest.of(0, LIVE_FEED_CAP));

        // Batch-load scanner display names in one query (avoids an N+1 per attendance row).
        Map<UUID, String> scannerNames = users
                .findAllById(rows.stream().map(EventCheckin::getScannedBy).distinct().toList()).stream()
                .collect(Collectors.toMap(User::getId, User::getFullName, (a, b) -> a));

        List<AttendanceRecord> records = rows.stream()
                .map(c -> new AttendanceRecord(c.getId(), c.getSubmissionId(), c.getGuestName(),
                        c.getGuestPhone(), c.getCheckedInAt(), c.getSource(),
                        scannerNames.get(c.getScannedBy())))
                .toList();
        return new AttendanceResponse(registered, checkedIn, records);
    }

    // ---- shared confirm path (scan + manual) --------------------------------

    private CheckinResult confirm(UUID eventId, RegistrationSubmission sub, UserPrincipal scanner,
                                  CheckinSource source) {
        if (!sub.getEventId().equals(eventId)) {
            throw new NotFoundException("Ticket not found."); // token from another event — don't leak
        }
        if (sub.getQrStatus() == TicketStatus.REVOKED) {
            throw new DomainConflictException(ErrorCode.TICKET_INVALID, "This ticket has been revoked.");
        }
        Event event = events.findById(eventId)
                .orElseThrow(() -> new NotFoundException("Event not found."));
        if (!withinCheckinWindow(event)) {
            throw new DomainConflictException(ErrorCode.TICKET_INVALID,
                    "Check-in is not open for this event yet.");
        }

        // Common case (deliberate re-scan): the row already exists — return the original time. Read
        // BEFORE the insert; a post-violation read would run in an aborted PostgreSQL transaction.
        checkins.findBySubmissionId(sub.getId()).ifPresent(existing -> {
            throw new DomainConflictException(ErrorCode.ALREADY_CHECKED_IN,
                    "Guest already checked in at " + existing.getCheckedInAt() + ".");
        });

        Instant now = Instant.now();
        EventCheckin checkin = new EventCheckin();
        checkin.setEventId(eventId);
        checkin.setSubmissionId(sub.getId());
        checkin.setGuestName(sub.getGuestName());
        checkin.setGuestPhone(sub.getGuestPhone());
        checkin.setScannedBy(scanner.id());
        checkin.setSource(source);
        checkin.setCheckedInAt(now);
        try {
            checkin = checkins.saveAndFlush(checkin); // flush so the UNIQUE race surfaces here
        } catch (DataIntegrityViolationException race) {
            // UNIQUE(submission_id) backstop for the true concurrent door-rush race: a parallel scan
            // committed first. The transaction is now aborted, so we can't re-read — return the
            // idempotent 409 without a DB round-trip (the eager check above carries the timestamp).
            throw new DomainConflictException(ErrorCode.ALREADY_CHECKED_IN,
                    "Guest already checked in.");
        }
        sub.setQrStatus(TicketStatus.CHECKED_IN);
        submissions.save(sub);

        // After-commit: push to the Telegram ops channel and flip telegram_notified (docs/04 §2.2,
        // docs/06 §4,§7). Fired after commit so a slow/failing Telegram can't roll back the scan; a
        // failed push leaves telegram_notified=false for the retry sweep.
        eventPublisher.publishEvent(new GuestCheckedInEvent(checkin.getId()));
        return new CheckinResult(checkin.getId(), sub.getId(), sub.getGuestName(), sub.getGuestPhone(),
                checkin.getCheckedInAt(), TicketStatus.CHECKED_IN.name(), scanner.id(), source, true);
    }

    /** Scans are accepted from {@code checkin_opens_at} onward; an unset opening time is always open. */
    private boolean withinCheckinWindow(Event event) {
        Instant opensAt = event.getCheckinOpensAt();
        return opensAt == null || !Instant.now().isBefore(opensAt);
    }
}
