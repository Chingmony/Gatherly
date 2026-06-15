package com.gatherly.service;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.Event;
import com.gatherly.domain.EventAssignment;
import com.gatherly.domain.EventStatus;
import com.gatherly.domain.GlobalRole;
import com.gatherly.dto.event.EventCreateRequest;
import com.gatherly.dto.event.EventResponse;
import com.gatherly.dto.event.EventUpdateRequest;
import com.gatherly.mapper.EventMapper;
import com.gatherly.repository.EventAssignmentRepository;
import com.gatherly.repository.EventRepository;
import com.gatherly.repository.RegistrationSubmissionRepository;
import com.gatherly.repository.RegistrationSubmissionRepository.EventRegistrationCount;
import com.gatherly.security.UserPrincipal;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link EventService} implementation. Authorization is enforced by {@code @PreAuthorize}: global
 * actions (create/publish/archive/delete/rotate) are Admin-only; read/edit go through {@code
 * @eventSecurity}. Lifecycle legality is enforced by {@link EventStatus} ({@code docs/02} §5-style).
 */
@Service
public class EventServiceImpl implements EventService {

  private final EventRepository eventRepository;
  private final EventAssignmentRepository assignmentRepository;
  private final RegistrationSubmissionRepository submissionRepository;
  private final EventMapper eventMapper;
  private final SecureRandom random = new SecureRandom();

  public EventServiceImpl(
      EventRepository eventRepository,
      EventAssignmentRepository assignmentRepository,
      RegistrationSubmissionRepository submissionRepository,
      EventMapper eventMapper) {
    this.eventRepository = eventRepository;
    this.assignmentRepository = assignmentRepository;
    this.submissionRepository = submissionRepository;
    this.eventMapper = eventMapper;
  }

  @Override
  @PreAuthorize("isAuthenticated()")
  @Transactional(readOnly = true)
  public Page<EventResponse> list(String query, Pageable pageable, UserPrincipal principal) {
    String q = (query == null || query.isBlank()) ? null : query.trim();
    if (principal.role() == GlobalRole.ADMIN) {
      return withCounts(eventRepository.search(q, pageable));
    }
    // Non-admins see only events they are assigned to (MANAGER or HANDLER).
    List<UUID> eventIds =
        assignmentRepository.findByUserId(principal.id()).stream()
            .map(EventAssignment::getEventId)
            .distinct()
            .toList();
    if (eventIds.isEmpty()) {
      return Page.empty(pageable);
    }
    return withCounts(eventRepository.searchScoped(eventIds, q, pageable));
  }

  /** Maps a page of events to responses, resolving registration counts in a single grouped query. */
  private Page<EventResponse> withCounts(Page<Event> events) {
    List<UUID> ids = events.map(Event::getId).getContent();
    Map<UUID, Long> counts =
        ids.isEmpty()
            ? Map.of()
            : submissionRepository.countByEventIdIn(ids).stream()
                .collect(
                    Collectors.toMap(
                        EventRegistrationCount::getEventId, EventRegistrationCount::getCount));
    return events.map(e -> eventMapper.toResponse(e, counts.getOrDefault(e.getId(), 0L)));
  }

  /** Maps a single event, resolving its live registration count. */
  private EventResponse toResponse(Event event) {
    return eventMapper.toResponse(event, submissionRepository.countByEventId(event.getId()));
  }

  @Override
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public EventResponse create(EventCreateRequest request, UserPrincipal principal) {
    Event event = new Event();
    event.setTitle(request.title());
    event.setSlug(uniqueSlug(request.title()));
    event.setCategory(request.category());
    event.setCapacity(request.capacity());
    event.setDescription(request.description());
    event.setVenue(request.venue());
    event.setCoverColor(request.coverColor());
    event.setCoverImageUrl(request.coverImageUrl());
    event.setStartsAt(request.startsAt());
    event.setEndsAt(request.endsAt());
    event.setCheckinOpensAt(request.checkinOpensAt());
    event.setStatus(EventStatus.DRAFT);
    event.setCreatedBy(principal.id());
    return toResponse(eventRepository.save(event));
  }

  @Override
  @PreAuthorize("@eventSecurity.canView(#eventId, authentication)")
  @Transactional(readOnly = true)
  public EventResponse get(UUID eventId) {
    return toResponse(load(eventId));
  }

  @Override
  @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
  @Transactional
  public EventResponse update(UUID eventId, EventUpdateRequest request) {
    Event event = load(eventId);
    if (request.title() != null) {
      event.setTitle(request.title());
    }
    if (request.category() != null) {
      event.setCategory(request.category());
    }
    if (request.capacity() != null) {
      event.setCapacity(request.capacity());
    }
    if (request.description() != null) {
      event.setDescription(request.description());
    }
    if (request.venue() != null) {
      event.setVenue(request.venue());
    }
    if (request.coverColor() != null) {
      event.setCoverColor(request.coverColor());
    }
    if (request.coverImageUrl() != null) {
      event.setCoverImageUrl(request.coverImageUrl());
    }
    if (request.startsAt() != null) {
      event.setStartsAt(request.startsAt());
    }
    if (request.endsAt() != null) {
      event.setEndsAt(request.endsAt());
    }
    if (request.checkinOpensAt() != null) {
      event.setCheckinOpensAt(request.checkinOpensAt());
    }
    return toResponse(event);
  }

  @Override
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public EventResponse publish(UUID eventId) {
    return transition(eventId, EventStatus.PUBLIC, "Only DRAFT events can be published.");
  }

  @Override
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public EventResponse archive(UUID eventId) {
    return transition(eventId, EventStatus.ARCHIVED, "Only PUBLIC events can be archived.");
  }

  @Override
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public void delete(UUID eventId) {
    eventRepository.delete(load(eventId));
  }

  @Override
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public EventResponse rotateRegistrationQr(UUID eventId) {
    Event event = load(eventId);
    event.setRegistrationQrToken(randomToken());
    return toResponse(event);
  }

  private EventResponse transition(UUID eventId, EventStatus target, String illegalMessage) {
    Event event = load(eventId);
    if (!event.getStatus().canTransitionTo(target)) {
      throw new ApiException(ErrorCode.CONFLICT, illegalMessage);
    }
    event.setStatus(target);
    return toResponse(event);
  }

  private Event load(UUID eventId) {
    return eventRepository
        .findById(eventId)
        .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Event not found."));
  }

  private String uniqueSlug(String title) {
    String base = slugify(title);
    String slug = base;
    int attempt = 0;
    while (eventRepository.existsBySlug(slug)) {
      slug = base + "-" + Integer.toHexString(random.nextInt(0x10000));
      if (++attempt > 5) {
        slug = base + "-" + UUID.randomUUID().toString().substring(0, 8);
        break;
      }
    }
    return slug;
  }

  private static String slugify(String title) {
    String s = title.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    if (s.length() > 200) {
      s = s.substring(0, 200).replaceAll("-$", "");
    }
    return s.isBlank() ? "event" : s;
  }

  private String randomToken() {
    byte[] bytes = new byte[24];
    random.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }
}
