package com.gatherly.event;

import com.gatherly.common.error.AppException;
import com.gatherly.common.error.DomainConflictException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.error.NotFoundException;
import com.gatherly.event.domain.Event;
import com.gatherly.event.domain.EventStatus;
import com.gatherly.event.dto.CreateEventRequest;
import com.gatherly.event.dto.UpdateEventRequest;
import com.gatherly.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

/**
 * Event lifecycle (docs/06 §3). CRUD + {@code DRAFT → PUBLIC → ARCHIVED} transitions. Authorization
 * gates live here on the service layer (docs/06 §1): create/publish/archive/delete are Admin-only
 * (docs/03 §4.4 — Sub-admin can never delete an event); read/update are event-scoped via
 * {@code @eventSecurity} (Admin-only in M2 until {@code event_assignment} lands in M3).
 */
@Service
@Transactional
public class EventService {

    private final EventRepository events;

    public EventService(EventRepository events) {
        this.events = events;
    }

    // ---- Read (service-scoped, docs/03 §4.4) --------------------------------

    /**
     * List events the caller may see: Admin sees all; a member sees only events they are related to
     * (M2: events they created; M3 extends this to {@code event_assignment} membership).
     */
    @Transactional(readOnly = true)
    public Page<Event> list(String query, Pageable pageable, UserPrincipal principal) {
        boolean admin = principal != null && principal.role() != null
                && "ADMIN".equals(principal.role().name());
        if (admin) {
            return (query == null || query.isBlank())
                    ? events.findAll(pageable)
                    : events.findByTitleContainingIgnoreCase(query, pageable);
        }
        UUID me = principal == null ? null : principal.id();
        return events.findByCreatedBy(me, pageable);
    }

    @PreAuthorize("@eventSecurity.canView(#eventId, authentication)")
    @Transactional(readOnly = true)
    public Event get(UUID eventId) {
        return findOrThrow(eventId);
    }

    // ---- Create / update -----------------------------------------------------

    @PreAuthorize("hasRole('ADMIN')")
    public Event create(CreateEventRequest req, UserPrincipal creator) {
        validateTimes(req.startsAt(), req.endsAt());
        Event e = new Event();
        e.setTitle(req.title());
        e.setDescription(req.description());
        e.setVenue(req.venue());
        e.setStartsAt(req.startsAt());
        e.setEndsAt(req.endsAt());
        e.setStatus(EventStatus.DRAFT);
        e.setSlug(uniqueSlug(req.title()));
        e.setCreatedBy(creator == null ? null : creator.id());
        return events.save(e);
    }

    @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
    public Event update(UUID eventId, UpdateEventRequest req) {
        validateTimes(req.startsAt(), req.endsAt());
        Event e = findOrThrow(eventId);
        e.setTitle(req.title());
        e.setDescription(req.description());
        e.setVenue(req.venue());
        e.setStartsAt(req.startsAt());
        e.setEndsAt(req.endsAt());
        return events.save(e);
    }

    // ---- Lifecycle transitions (docs/02 §3.3, docs/13 §M2) ------------------

    /** Draft → Public (activates guest registration). Admin only (docs/03 §4.4). */
    @PreAuthorize("hasRole('ADMIN')")
    public Event publish(UUID eventId) {
        Event e = findOrThrow(eventId);
        if (e.getStatus() != EventStatus.DRAFT) {
            throw new DomainConflictException(ErrorCode.CONFLICT,
                    "Only a DRAFT event can be published.");
        }
        e.setStatus(EventStatus.PUBLIC);
        return events.save(e);
    }

    /** Draft/Public → Archived. Admin only — completes the lifecycle (docs/02 §3.3). */
    @PreAuthorize("hasRole('ADMIN')")
    public Event archive(UUID eventId) {
        Event e = findOrThrow(eventId);
        if (e.getStatus() == EventStatus.ARCHIVED) {
            throw new DomainConflictException(ErrorCode.CONFLICT, "Event is already archived.");
        }
        e.setStatus(EventStatus.ARCHIVED);
        return events.save(e);
    }

    /** Hard-delete (Admin only; Sub-admin forbidden, docs/00 §5). Children cascade via FK. */
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(UUID eventId) {
        Event e = findOrThrow(eventId);
        events.delete(e);
    }

    // ---- Helpers -------------------------------------------------------------

    private void validateTimes(java.time.Instant startsAt, java.time.Instant endsAt) {
        if (startsAt != null && endsAt != null && endsAt.isBefore(startsAt)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Event end must be after its start.");
        }
    }

    private Event findOrThrow(UUID eventId) {
        return events.findById(eventId).orElseThrow(() -> new NotFoundException("Event not found."));
    }

    /** Slugify the title and guarantee uniqueness with a short suffix on collision. */
    private String uniqueSlug(String title) {
        String base = slugify(title);
        if (base.isBlank()) {
            base = "event";
        }
        String candidate = base;
        while (events.existsBySlug(candidate)) {
            String suffix = UUID.randomUUID().toString().substring(0, 6);
            candidate = trim(base, 220 - suffix.length() - 1) + "-" + suffix;
        }
        return candidate;
    }

    private static String slugify(String input) {
        String s = input.toLowerCase(Locale.ROOT).trim()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        return trim(s, 220);
    }

    private static String trim(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max);
    }
}
