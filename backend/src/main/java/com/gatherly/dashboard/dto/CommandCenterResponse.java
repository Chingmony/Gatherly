package com.gatherly.dashboard.dto;

import com.gatherly.event.domain.EventStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Admin Command Center aggregate (docs/03 §4.13, docs/06 §11) — the global-oversight payload for
 * the dashboard's three zones: Global Pulse (lifecycle + registration momentum + material health),
 * the Event Control Center table, and the Critical Attention stream.
 *
 * <p>{@code materialHealth} and {@code critical} are backed by the material/task domain, which is
 * not implemented in this slice — they are {@code null} / empty here and the UI renders an explicit
 * "not tracked yet" state rather than fabricated numbers (the API is the source of authority,
 * docs/05 §1).
 */
public record CommandCenterResponse(
        Lifecycle lifecycle,
        Registration registration,
        MaterialHealth materialHealth,
        List<EventRow> events,
        List<CriticalIssue> critical
) {

    /** Donut: live vs draft, with the org-wide total. {@code completed} = ARCHIVED. */
    public record Lifecycle(long total, long draft, long live, long completed) {
    }

    /** Registration momentum: tickets issued vs capacity, plus org-wide check-ins. */
    public record Registration(long totalRegistered, long totalCheckedIn, long totalCapacity, int fillPct) {
    }

    /** Material Health Index — segmented status bar. Null until the material domain lands. */
    public record MaterialHealth(long total, int onTrackPct, long issues, List<Bucket> buckets) {
        public record Bucket(String id, String label, long count) {
        }
    }

    /** One row of the Event Control Center table. */
    public record EventRow(
            UUID id,
            String title,
            String slug,
            EventStatus status,
            Instant startsAt,
            String venue,
            String category,
            String coverGradient,
            String coverImageKey,
            Integer capacity,
            long registered,
            long checkedIn,
            UUID managerId,
            String managerName,
            long issueCount
    ) {
    }

    /** A flagged issue in the Critical Attention stream (material domain — empty in this slice). */
    public record CriticalIssue(
            UUID eventId,
            String eventName,
            String coverGradient,
            String handlerName,
            String task,
            String note,
            Instant when
    ) {
    }
}
