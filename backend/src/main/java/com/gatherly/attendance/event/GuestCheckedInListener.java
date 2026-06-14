package com.gatherly.attendance.event;

import com.gatherly.integration.telegram.TelegramOpsService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * After a check-in commits (docs/06 §4, §7), forward it to the Telegram ops channel. Running after
 * commit (mirroring {@code GuestRegisteredListener}) keeps the organizer scan fast and crash-safe:
 * the attendance row is already durable, and a Telegram failure just leaves {@code telegram_notified}
 * false for the retry sweep.
 */
@Component
public class GuestCheckedInListener {

    private final TelegramOpsService ops;

    public GuestCheckedInListener(TelegramOpsService ops) {
        this.ops = ops;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onGuestCheckedIn(GuestCheckedInEvent event) {
        ops.forwardCheckin(event.checkinId());
    }
}
