package com.gatherly.agenda;

import com.gatherly.agenda.domain.AgendaItem;
import com.gatherly.agenda.domain.AgendaTemplate;
import com.gatherly.agenda.dto.AgendaItemRequest;
import com.gatherly.agenda.dto.AgendaItemResponse;
import com.gatherly.agenda.dto.AgendaResponse;
import com.gatherly.agenda.dto.AgendaTemplateResponse;
import com.gatherly.common.error.NotFoundException;
import com.gatherly.event.EventRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.UUID;

/**
 * Event agenda (docs/06 §3, docs/03 §4.4 "Events & agenda"). Reads are event-scoped ({@code canView});
 * the full-replace edit is event-scoped ({@code canManage}) — both Admin-only in M2 until the
 * {@code event_assignment} resolution lands in M3. Global templates are readable by any authenticated
 * user. Gates live here on the service layer (docs/06 §1).
 */
@Service
@Transactional
public class AgendaService {

    private final AgendaItemRepository items;
    private final AgendaTemplateRepository templates;
    private final EventRepository events;
    private final JsonMapper jsonMapper;

    public AgendaService(AgendaItemRepository items, AgendaTemplateRepository templates,
                         EventRepository events, JsonMapper jsonMapper) {
        this.items = items;
        this.templates = templates;
        this.events = events;
        this.jsonMapper = jsonMapper;
    }

    @PreAuthorize("@eventSecurity.canView(#eventId, authentication)")
    @Transactional(readOnly = true)
    public AgendaResponse getAgenda(UUID eventId) {
        requireEvent(eventId);
        return new AgendaResponse(eventId, fetch(eventId));
    }

    /** Replace the event's agenda in order (docs/03 §4.4 — apply template / reorder). */
    @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
    public AgendaResponse replaceAgenda(UUID eventId, List<AgendaItemRequest> requested) {
        requireEvent(eventId);
        items.deleteByEventId(eventId);
        int position = 0;
        for (AgendaItemRequest r : requested) {
            AgendaItem item = new AgendaItem();
            item.setEventId(eventId);
            item.setTitle(r.title());
            item.setSection(blankToNull(r.section()));
            item.setStartsAt(r.startsAt());
            item.setEndsAt(r.endsAt());
            item.setPosition(position++);
            items.save(item);
        }
        return new AgendaResponse(eventId, fetch(eventId));
    }

    @Transactional(readOnly = true)
    public List<AgendaTemplateResponse> listTemplates() {
        return templates.findAllByOrderByIsDefaultDescNameAsc().stream()
                .map(t -> new AgendaTemplateResponse(
                        t.getId(), t.getName(), jsonMapper.readTree(t.getItems()), t.isDefault()))
                .toList();
    }

    /** Normalise an optional section label: blank/whitespace becomes null. */
    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private List<AgendaItemResponse> fetch(UUID eventId) {
        return items.findByEventIdOrderByPositionAsc(eventId).stream()
                .map(AgendaMapper::toResponse)
                .toList();
    }

    private void requireEvent(UUID eventId) {
        if (!events.existsById(eventId)) {
            throw new NotFoundException("Event not found.");
        }
    }
}
