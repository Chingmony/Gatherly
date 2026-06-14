package com.gatherly.integration.telegram;

import com.gatherly.attendance.EventCheckinRepository;
import com.gatherly.attendance.domain.EventCheckin;
import com.gatherly.event.EventRepository;
import com.gatherly.event.domain.Event;
import com.gatherly.registration.RegistrationSubmissionRepository;
import com.gatherly.registration.domain.RegistrationSubmission;
import com.gatherly.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Forwards registration + confirmed-attendance events to the Telegram ops channel (docs/04 §2.2,
 * docs/06 §6–7) and flips the {@code telegram_notified} flag on success. Shared by the after-commit
 * listeners (immediate push, "within seconds") and the retry sweep. Each method runs in its own
 * {@code REQUIRES_NEW} transaction — invoked <b>after</b> the originating commit, never inside it, so
 * Telegram latency/failure can't roll back or block the guest/organizer action. Idempotent: an
 * already-notified row is skipped, so a double-run (immediate push racing the sweep) can't double-post.
 */
@Service
public class TelegramOpsService {

    private static final DateTimeFormatter WHEN =
            DateTimeFormatter.ofPattern("MMM d, yyyy HH:mm").withZone(ZoneOffset.UTC);

    private final RegistrationSubmissionRepository submissions;
    private final EventCheckinRepository checkins;
    private final EventRepository events;
    private final UserRepository users;
    private final TelegramNotifier notifier;

    public TelegramOpsService(RegistrationSubmissionRepository submissions, EventCheckinRepository checkins,
                              EventRepository events, UserRepository users, TelegramNotifier notifier) {
        this.submissions = submissions;
        this.checkins = checkins;
        this.events = events;
        this.users = users;
        this.notifier = notifier;
    }

    /** Forward a new registration to the ops channel; flip {@code telegram_notified} on success. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean forwardRegistration(UUID submissionId) {
        RegistrationSubmission sub = submissions.findById(submissionId).orElse(null);
        if (sub == null || sub.isTelegramNotified()) {
            return false;
        }
        String text = """
                📝 <b>Registered</b> — %s
                👤 %s   📞 %s
                🕒 %s""".formatted(
                escape(eventTitle(sub.getEventId())),
                escape(orDash(sub.getGuestName())), escape(sub.getGuestPhone()),
                WHEN.format(sub.getSubmittedAt()));
        if (notifier.send(text)) {
            sub.setTelegramNotified(true);
            submissions.save(sub);
            return true;
        }
        return false;
    }

    /** Forward a confirmed check-in to the ops channel; flip {@code telegram_notified} on success. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean forwardCheckin(UUID checkinId) {
        EventCheckin checkin = checkins.findById(checkinId).orElse(null);
        if (checkin == null || checkin.isTelegramNotified()) {
            return false;
        }
        String text = """
                ✅ <b>Checked in</b> — %s
                👤 %s   📞 %s
                🕒 %s   🙋 by %s""".formatted(
                escape(eventTitle(checkin.getEventId())),
                escape(orDash(checkin.getGuestName())), escape(checkin.getGuestPhone()),
                WHEN.format(checkin.getCheckedInAt()), escape(scannedByName(checkin.getScannedBy())));
        if (notifier.send(text)) {
            checkin.setTelegramNotified(true);
            checkins.save(checkin);
            return true;
        }
        return false;
    }

    private String eventTitle(UUID eventId) {
        return events.findById(eventId).map(Event::getTitle).orElse("event");
    }

    private String scannedByName(UUID userId) {
        return users.findById(userId).map(u -> u.getFullName()).filter(n -> n != null && !n.isBlank())
                .orElse("staff");
    }

    private static String orDash(String s) {
        return s == null || s.isBlank() ? "—" : s;
    }

    private static String escape(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
