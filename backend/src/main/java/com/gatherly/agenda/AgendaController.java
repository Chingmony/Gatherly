package com.gatherly.agenda;

import com.gatherly.agenda.dto.AgendaResponse;
import com.gatherly.agenda.dto.AgendaTemplateResponse;
import com.gatherly.agenda.dto.UpdateAgendaRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Agenda endpoints (docs/03 §4.4). Thin controller: the event-scoped gates live on
 * {@link AgendaService}. {@code GET /agenda-templates} is authenticated (no further gate).
 */
@RestController
@RequestMapping("/api/v1")
public class AgendaController {

    private final AgendaService agendaService;

    public AgendaController(AgendaService agendaService) {
        this.agendaService = agendaService;
    }

    @GetMapping("/events/{eventId}/agenda")
    public AgendaResponse getAgenda(@PathVariable UUID eventId) {
        return agendaService.getAgenda(eventId);
    }

    @PutMapping("/events/{eventId}/agenda")
    public AgendaResponse updateAgenda(@PathVariable UUID eventId,
                                       @Valid @RequestBody UpdateAgendaRequest req) {
        return agendaService.replaceAgenda(eventId, req.items());
    }

    @GetMapping("/agenda-templates")
    public List<AgendaTemplateResponse> templates() {
        return agendaService.listTemplates();
    }
}
