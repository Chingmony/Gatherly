package com.gatherly.service;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.AgendaItem;
import com.gatherly.dto.agenda.AgendaItemRequest;
import com.gatherly.dto.agenda.AgendaItemResponse;
import com.gatherly.mapper.AgendaMapper;
import com.gatherly.repository.AgendaItemRepository;
import com.gatherly.repository.EventRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link AgendaService} implementation. Listing is gated by {@code @eventSecurity.canView}; mutations
 * by {@code @eventSecurity.canManage} (ADMIN or event MANAGER) — matching the agenda gate in {@code
 * docs/03} §4.4. New items append at {@code max(position) + 1}; an event with no items returns an
 * empty list (the gate already rejects unknown/forbidden events with 403).
 */
@Service
public class AgendaServiceImpl implements AgendaService {

  private final AgendaItemRepository agendaItemRepository;
  private final EventRepository eventRepository;
  private final AgendaMapper mapper;

  public AgendaServiceImpl(
      AgendaItemRepository agendaItemRepository,
      EventRepository eventRepository,
      AgendaMapper mapper) {
    this.agendaItemRepository = agendaItemRepository;
    this.eventRepository = eventRepository;
    this.mapper = mapper;
  }

  @Override
  @PreAuthorize("@eventSecurity.canView(#eventId, authentication)")
  @Transactional(readOnly = true)
  public List<AgendaItemResponse> list(UUID eventId) {
    return agendaItemRepository.findByEventIdOrderByPositionAsc(eventId).stream()
        .map(mapper::toResponse)
        .toList();
  }

  @Override
  @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
  @Transactional
  public AgendaItemResponse create(UUID eventId, AgendaItemRequest request) {
    if (!eventRepository.existsById(eventId)) {
      throw new ApiException(ErrorCode.NOT_FOUND, "Event not found.");
    }
    validateTiming(request);
    AgendaItem item = new AgendaItem();
    item.setEventId(eventId);
    item.setPosition(agendaItemRepository.findMaxPosition(eventId) + 1);
    apply(item, request);
    return mapper.toResponse(agendaItemRepository.save(item));
  }

  @Override
  @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
  @Transactional
  public AgendaItemResponse update(UUID eventId, UUID itemId, AgendaItemRequest request) {
    validateTiming(request);
    AgendaItem item = loadInEvent(itemId, eventId);
    apply(item, request);
    return mapper.toResponse(item);
  }

  @Override
  @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
  @Transactional
  public void delete(UUID eventId, UUID itemId) {
    agendaItemRepository.delete(loadInEvent(itemId, eventId));
  }

  private void apply(AgendaItem item, AgendaItemRequest request) {
    item.setTitle(request.title().trim());
    item.setStartsAt(request.startsAt());
    item.setEndsAt(request.endsAt());
  }

  private void validateTiming(AgendaItemRequest request) {
    if (request.startsAt() != null
        && request.endsAt() != null
        && !request.endsAt().isAfter(request.startsAt())) {
      throw new ApiException(ErrorCode.VALIDATION_ERROR, "End time must be after the start time.");
    }
  }

  private AgendaItem loadInEvent(UUID itemId, UUID eventId) {
    AgendaItem item =
        agendaItemRepository
            .findById(itemId)
            .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Agenda item not found."));
    if (!item.getEventId().equals(eventId)) {
      throw new ApiException(ErrorCode.NOT_FOUND, "Agenda item not found for this event.");
    }
    return item;
  }
}
