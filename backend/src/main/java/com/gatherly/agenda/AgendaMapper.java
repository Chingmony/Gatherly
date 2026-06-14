package com.gatherly.agenda;

import com.gatherly.agenda.domain.AgendaItem;
import com.gatherly.agenda.dto.AgendaItemResponse;

/** Hand-written mapping (docs/06 §1) for agenda items. */
public final class AgendaMapper {

    private AgendaMapper() {
    }

    public static AgendaItemResponse toResponse(AgendaItem i) {
        return new AgendaItemResponse(i.getId(), i.getTitle(), i.getStartsAt(), i.getEndsAt(), i.getPosition());
    }
}
