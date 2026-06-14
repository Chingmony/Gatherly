package com.gatherly.registration.event;

import com.gatherly.registration.QrTicketDeliveryService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * After the registration transaction commits (docs/06 §2, §6), render + email the guest's QR ticket
 * and flip the ticket {@code PENDING → DELIVERED}. Running after commit (mirroring
 * {@code UserCreatedListener}) means a slow/failed mail server can't roll back the registration;
 * tickets that fail to send stay {@code PENDING} for the retry sweep + on-screen fallback.
 */
@Component
public class GuestRegisteredListener {

    private final QrTicketDeliveryService delivery;

    public GuestRegisteredListener(QrTicketDeliveryService delivery) {
        this.delivery = delivery;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onGuestRegistered(GuestRegisteredEvent event) {
        delivery.deliver(event.submissionId());
    }
}
