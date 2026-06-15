package com.gatherly.common.observability;

import com.gatherly.attendance.event.GuestCheckedInEvent;
import com.gatherly.registration.event.GuestRegisteredEvent;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Business metrics (docs/08 §3) exported to Prometheus via Micrometer. Counts are driven off the
 * existing domain events (after-commit), so no service code is touched and the counters can't fire
 * for a rolled-back action. Tags are intentionally low-cardinality (no per-event tag, which would
 * explode the series); per-event breakdowns come from the DB, not metrics.
 */
@Component
public class BusinessMetrics {

    private final Counter registrations;
    private final Counter checkins;

    public BusinessMetrics(MeterRegistry registry) {
        this.registrations = Counter.builder("gatherly.registrations")
                .description("Guest registrations created").register(registry);
        this.checkins = Counter.builder("gatherly.checkins")
                .description("Attendance check-ins confirmed").register(registry);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onRegistered(GuestRegisteredEvent event) {
        registrations.increment();
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCheckedIn(GuestCheckedInEvent event) {
        checkins.increment();
    }
}
