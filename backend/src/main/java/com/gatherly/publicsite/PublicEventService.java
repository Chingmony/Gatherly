package com.gatherly.publicsite;

import com.gatherly.agenda.AgendaItemRepository;
import com.gatherly.agenda.AgendaMapper;
import com.gatherly.agenda.dto.AgendaItemResponse;
import com.gatherly.common.error.NotFoundException;
import com.gatherly.event.EventRepository;
import com.gatherly.event.domain.Event;
import com.gatherly.event.domain.EventStatus;
import com.gatherly.form.RegistrationFormRepository;
import com.gatherly.form.domain.FormStatus;
import com.gatherly.registration.RegistrationSubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Read-only public event detail (docs/03 §4.9). Composes the event, its registration count, whether
 * an ACTIVE form gates registration, and the published agenda into one {@link PublicEventDetail} so
 * the guest detail page renders in a single round-trip. Unauthenticated — Layer-1 {@code permitAll}
 * covers {@code /api/v1/public/**}; this service only ever exposes events with status {@code PUBLIC}
 * (a non-public slug is reported as not-found so draft/archived events never leak).
 */
@Service
@Transactional(readOnly = true)
public class PublicEventService {

    private final EventRepository events;
    private final RegistrationSubmissionRepository submissions;
    private final RegistrationFormRepository forms;
    private final AgendaItemRepository agendaItems;

    public PublicEventService(EventRepository events, RegistrationSubmissionRepository submissions,
                              RegistrationFormRepository forms, AgendaItemRepository agendaItems) {
        this.events = events;
        this.submissions = submissions;
        this.forms = forms;
        this.agendaItems = agendaItems;
    }

    public PublicEventDetail detail(String slug) {
        // Visibility filter pushed into the query — a non-PUBLIC slug 404s without hydrating the row.
        Event e = events.findBySlugAndStatus(slug, EventStatus.PUBLIC)
                .orElseThrow(() -> new NotFoundException("Event not found.")); // don't leak non-public

        long registered = submissions.countByEventId(e.getId());
        boolean registrationOpen = forms.findByEventId(e.getId())
                .map(f -> f.getStatus() == FormStatus.ACTIVE)
                .orElse(false);
        List<AgendaItemResponse> agenda = agendaItems.findByEventIdOrderByPositionAsc(e.getId()).stream()
                .map(AgendaMapper::toResponse)
                .toList();

        return new PublicEventDetail(
                e.getId(), e.getSlug(), e.getTitle(), e.getCategory(), e.getVenue(),
                e.getStartsAt(), e.getEndsAt(), e.getDescription(), e.getCoverGradient(),
                registered, e.getCapacity(), e.getTags(), registrationOpen, agenda);
    }
}
