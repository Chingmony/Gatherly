package com.gatherly.registration.event;

import com.gatherly.integration.telegram.TelegramOpsService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * After a registration commits (docs/06 §6, docs/04 §2.2), forward it to the Telegram ops channel —
 * a second, independent {@code AFTER_COMMIT} consumer of {@link GuestRegisteredEvent} alongside the
 * QR-ticket email listener. Kept separate so a Telegram outage can't affect ticket delivery (and
 * vice versa); an un-pushed registration stays {@code telegram_notified=false} for the sweep (§7).
 */
@Component
public class RegisteredOpsForwardingListener {

    private final TelegramOpsService ops;

    public RegisteredOpsForwardingListener(TelegramOpsService ops) {
        this.ops = ops;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onGuestRegistered(GuestRegisteredEvent event) {
        ops.forwardRegistration(event.submissionId());
    }
}
