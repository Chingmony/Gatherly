package com.gatherly.agenda;

import com.gatherly.agenda.domain.AgendaTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AgendaTemplateRepository extends JpaRepository<AgendaTemplate, UUID> {

    /** Built-in defaults first, then alphabetical (docs/03 §4.4 GET /agenda-templates). */
    List<AgendaTemplate> findAllByOrderByIsDefaultDescNameAsc();
}
