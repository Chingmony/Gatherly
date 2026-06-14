package com.gatherly.dashboard;

import com.gatherly.dashboard.dto.CommandCenterResponse;
import com.gatherly.event.EventAssignmentRepository;
import com.gatherly.event.EventRepository;
import com.gatherly.event.domain.Event;
import com.gatherly.event.domain.EventRole;
import com.gatherly.event.domain.EventStatus;
import com.gatherly.registration.RegistrationSubmissionRepository;
import com.gatherly.registration.RegistrationSubmissionRepository.EventSubmissionCount;
import com.gatherly.registration.domain.TicketStatus;
import com.gatherly.user.UserRepository;
import com.gatherly.user.domain.User;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Admin Command Center aggregation (docs/06 §11). Read-only, Admin-only — the gate lives here on the
 * service layer per the two-layer model (docs/03 §3). Every cross-event lookup is a single grouped
 * or batched query (no N+1): lifecycle counts and the capacity sum come from the DB grouped, and the
 * per-event registration / check-in / manager lookups are one query each over the capped row set.
 */
@Service
@Transactional(readOnly = true)
public class DashboardService {

    /** Cap on the control-center feed so the dashboard never issues an unbounded scan (docs/11). */
    private static final int ROW_LIMIT = 200;

    private final EventRepository events;
    private final EventAssignmentRepository assignments;
    private final RegistrationSubmissionRepository submissions;
    private final UserRepository users;

    public DashboardService(EventRepository events,
                            EventAssignmentRepository assignments,
                            RegistrationSubmissionRepository submissions,
                            UserRepository users) {
        this.events = events;
        this.assignments = assignments;
        this.submissions = submissions;
        this.users = users;
    }

    @PreAuthorize("hasRole('ADMIN')")
    public CommandCenterResponse commandCenter() {
        CommandCenterResponse.Lifecycle lifecycle = lifecycle();

        // Bounded, most-recent-first control feed.
        List<Event> rows = events.findAllByOrderByStartsAtDesc(PageRequest.of(0, ROW_LIMIT));
        List<UUID> eventIds = rows.stream().map(Event::getId).toList();

        Map<UUID, Long> registered = countMap(eventIds.isEmpty()
                ? List.of() : submissions.countByEventIds(eventIds));
        Map<UUID, Long> checkedIn = countMap(eventIds.isEmpty()
                ? List.of() : submissions.countByEventIdsAndQrStatus(eventIds, TicketStatus.CHECKED_IN));
        Map<UUID, UUID> managerByEvent = managersByEvent(eventIds);
        Map<UUID, String> managerNames = managerNames(managerByEvent.values());

        List<CommandCenterResponse.EventRow> eventRows = rows.stream()
                .map(e -> toRow(e, registered, checkedIn, managerByEvent, managerNames))
                .toList();

        // Org-wide registration momentum (across all events, not just the capped feed).
        long totalRegistered = submissions.count();
        long totalCheckedIn = submissions.countByQrStatus(TicketStatus.CHECKED_IN);
        long totalCapacity = events.sumCapacity();
        int fillPct = totalCapacity > 0
                ? (int) Math.min(100, Math.round(totalRegistered * 100.0 / totalCapacity))
                : 0;

        return new CommandCenterResponse(
                lifecycle,
                new CommandCenterResponse.Registration(totalRegistered, totalCheckedIn, totalCapacity, fillPct),
                // Material domain not implemented in this slice — null, UI shows a "not tracked" state.
                null,
                eventRows,
                List.of());
    }

    // ---- Helpers -------------------------------------------------------------

    private CommandCenterResponse.Lifecycle lifecycle() {
        Map<EventStatus, Long> byStatus = new EnumMap<>(EventStatus.class);
        for (EventRepository.StatusCount c : events.countGroupedByStatus()) {
            byStatus.put(c.getStatus(), c.getCnt());
        }
        long draft = byStatus.getOrDefault(EventStatus.DRAFT, 0L);
        long live = byStatus.getOrDefault(EventStatus.PUBLIC, 0L);
        long completed = byStatus.getOrDefault(EventStatus.ARCHIVED, 0L);
        return new CommandCenterResponse.Lifecycle(draft + live + completed, draft, live, completed);
    }

    private Map<UUID, UUID> managersByEvent(List<UUID> eventIds) {
        Map<UUID, UUID> managerByEvent = new HashMap<>();
        if (eventIds.isEmpty()) {
            return managerByEvent;
        }
        // First MANAGER assignment per event is shown as its manager (one query for all events).
        for (var a : assignments.findByEventIdInAndEventRole(eventIds, EventRole.MANAGER)) {
            managerByEvent.putIfAbsent(a.getEventId(), a.getUserId());
        }
        return managerByEvent;
    }

    private Map<UUID, String> managerNames(java.util.Collection<UUID> managerIds) {
        Set<UUID> ids = new LinkedHashSet<>(managerIds);
        if (ids.isEmpty()) {
            return Map.of();
        }
        return users.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, User::getFullName));
    }

    private static Map<UUID, Long> countMap(List<EventSubmissionCount> counts) {
        return counts.stream().collect(Collectors.toMap(
                EventSubmissionCount::getEventId, EventSubmissionCount::getCnt));
    }

    private static CommandCenterResponse.EventRow toRow(Event e,
                                                        Map<UUID, Long> registered,
                                                        Map<UUID, Long> checkedIn,
                                                        Map<UUID, UUID> managerByEvent,
                                                        Map<UUID, String> managerNames) {
        UUID managerId = managerByEvent.get(e.getId());
        return new CommandCenterResponse.EventRow(
                e.getId(),
                e.getTitle(),
                e.getSlug(),
                e.getStatus(),
                e.getStartsAt(),
                e.getVenue(),
                e.getCategory(),
                e.getCoverGradient(),
                e.getCoverImageKey(),
                e.getCapacity(),
                registered.getOrDefault(e.getId(), 0L),
                checkedIn.getOrDefault(e.getId(), 0L),
                managerId,
                managerId == null ? null : managerNames.get(managerId),
                0L); // issueCount — material domain not implemented in this slice.
    }
}
