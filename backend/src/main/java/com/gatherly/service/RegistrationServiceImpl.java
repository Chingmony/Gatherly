package com.gatherly.service;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.Event;
import com.gatherly.domain.EventStatus;
import com.gatherly.domain.FormFieldType;
import com.gatherly.domain.FormStatus;
import com.gatherly.domain.RegistrationForm;
import com.gatherly.domain.RegistrationSubmission;
import com.gatherly.domain.TicketStatus;
import com.gatherly.dto.form.FormField;
import com.gatherly.dto.registration.PublicEventResponse;
import com.gatherly.dto.registration.PublicFormResponse;
import com.gatherly.dto.registration.RegistrationRequest;
import com.gatherly.dto.registration.RegistrationResponse;
import com.gatherly.dto.registration.TicketResponse;
import com.gatherly.repository.EventRepository;
import com.gatherly.repository.RegistrationFormRepository;
import com.gatherly.repository.RegistrationSubmissionRepository;
import com.gatherly.repository.RegistrationSubmissionRepository.EventRegistrationCount;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import tools.jackson.databind.ObjectMapper;

/**
 * {@link RegistrationService} implementation — the registration → QR-ticket worked example ({@code
 * docs/06} §6). Validates answers against the active form, mints a CSPRNG {@code checkinToken}, and
 * dispatches the QR email <em>after commit</em>. A duplicate email re-sends the existing ticket
 * (one ticket per email per event).
 */
@Service
public class RegistrationServiceImpl implements RegistrationService {

  private final EventRepository eventRepository;
  private final RegistrationFormRepository formRepository;
  private final RegistrationSubmissionRepository submissionRepository;
  private final FormSchemaCodec schemaCodec;
  private final AnswerValidator answerValidator;
  private final QrTicketDispatcher dispatcher;
  private final com.gatherly.integration.qr.QrService qrService;
  private final OpsNotificationService opsNotificationService;
  private final ObjectMapper objectMapper;
  private final SecureRandom random = new SecureRandom();

  public RegistrationServiceImpl(
      EventRepository eventRepository,
      RegistrationFormRepository formRepository,
      RegistrationSubmissionRepository submissionRepository,
      FormSchemaCodec schemaCodec,
      AnswerValidator answerValidator,
      QrTicketDispatcher dispatcher,
      com.gatherly.integration.qr.QrService qrService,
      OpsNotificationService opsNotificationService,
      ObjectMapper objectMapper) {
    this.eventRepository = eventRepository;
    this.formRepository = formRepository;
    this.submissionRepository = submissionRepository;
    this.schemaCodec = schemaCodec;
    this.answerValidator = answerValidator;
    this.dispatcher = dispatcher;
    this.qrService = qrService;
    this.opsNotificationService = opsNotificationService;
    this.objectMapper = objectMapper;
  }

  @Override
  @Transactional(readOnly = true)
  public Page<PublicEventResponse> listPublicEvents(
      String search, String category, String location, Pageable pageable) {
    String q = blankToNull(search);
    String cat = blankToNull(category);
    String loc = blankToNull(location);
    Page<Event> events = eventRepository.searchPublic(q, cat, loc, pageable);
    List<UUID> ids = events.map(Event::getId).getContent();
    Map<UUID, Long> counts =
        ids.isEmpty()
            ? Map.of()
            : submissionRepository.countByEventIdIn(ids).stream()
                .collect(
                    Collectors.toMap(
                        EventRegistrationCount::getEventId, EventRegistrationCount::getCount));
    return events.map(e -> toPublicEvent(e, counts.getOrDefault(e.getId(), 0L)));
  }

  @Override
  @Transactional(readOnly = true)
  public PublicEventResponse getPublicEvent(String slug) {
    Event event = eventRepository.findBySlug(slug).orElseThrow(RegistrationServiceImpl::notFound);
    if (event.getStatus() != EventStatus.PUBLIC) {
      throw notFound(); // do not leak non-public events
    }
    return toPublicEvent(event, submissionRepository.countByEventId(event.getId()));
  }

  @Override
  @Transactional(readOnly = true)
  public PublicFormResponse getPublicForm(String slug) {
    Event event = eventRepository.findBySlug(slug).orElseThrow(RegistrationServiceImpl::notFound);
    return publicForm(event);
  }

  @Override
  @Transactional(readOnly = true)
  public PublicFormResponse resolvePoster(String registrationQrToken) {
    Event event =
        eventRepository
            .findByRegistrationQrToken(registrationQrToken)
            .orElseThrow(RegistrationServiceImpl::notFound);
    return publicForm(event);
  }

  @Override
  @Transactional
  public RegistrationResponse register(UUID eventId, RegistrationRequest request) {
    Event event = eventRepository.findById(eventId).orElseThrow(RegistrationServiceImpl::notFound);
    if (event.getStatus() != EventStatus.PUBLIC) {
      throw notFound(); // do not leak non-public events
    }
    RegistrationForm form = activeForm(event.getId());
    List<FormField> fields = schemaCodec.read(form.getSchema());
    Map<String, Object> answers = request.answers();
    answerValidator.validate(answers, fields);

    String email = valueOfType(fields, answers, FormFieldType.EMAIL);
    String phone = valueOfType(fields, answers, FormFieldType.PHONE);
    String name = guestName(fields, answers);

    RegistrationSubmission existing =
        submissionRepository
            .findByEventIdAndGuestEmailIgnoreCase(event.getId(), email)
            .orElse(null);
    if (existing != null) {
      dispatchAfterCommit(existing.getId());
      return new RegistrationResponse(
          existing.getId(),
          existing.getQrStatus(),
          dispatcher.ticketUrl(existing.getCheckinToken()),
          "You're already registered — we've re-sent your QR ticket to " + email + ".");
    }

    RegistrationSubmission submission = new RegistrationSubmission();
    submission.setFormId(form.getId());
    submission.setEventId(event.getId());
    submission.setAnswers(writeAnswers(answers));
    submission.setGuestEmail(email);
    submission.setGuestPhone(phone);
    submission.setGuestName(name);
    submission.setCheckinToken(newToken());
    submission.setQrStatus(TicketStatus.PENDING);
    submission.setFormVersion(form.getVersion());
    RegistrationSubmission saved = submissionRepository.save(submission);

    dispatchAfterCommit(saved.getId());
    opsRegisterAfterCommit(saved.getId());
    return new RegistrationResponse(
        saved.getId(),
        TicketStatus.PENDING,
        dispatcher.ticketUrl(saved.getCheckinToken()),
        "Your QR ticket has been sent to " + email + ". You can also view it at the link above.");
  }

  @Override
  @Transactional(readOnly = true)
  public TicketResponse getTicket(String checkinToken) {
    RegistrationSubmission submission =
        submissionRepository
            .findByCheckinToken(checkinToken)
            .orElseThrow(RegistrationServiceImpl::notFound);
    Event event = eventRepository.findById(submission.getEventId()).orElse(null);
    String dataUrl =
        "data:image/png;base64,"
            + Base64.getEncoder().encodeToString(qrService.renderPng(checkinToken, 300));
    return new TicketResponse(
        checkinToken,
        submission.getQrStatus(),
        submission.getGuestName(),
        event == null ? null : event.getTitle(),
        event == null ? null : event.getVenue(),
        event == null ? null : event.getStartsAt(),
        dataUrl);
  }

  @Override
  @Transactional(readOnly = true)
  public RegistrationResponse resend(String checkinToken) {
    RegistrationSubmission submission =
        submissionRepository
            .findByCheckinToken(checkinToken)
            .orElseThrow(RegistrationServiceImpl::notFound);
    if (submission.getQrStatus() == TicketStatus.CHECKED_IN
        || submission.getQrStatus() == TicketStatus.REVOKED) {
      throw new ApiException(ErrorCode.TICKET_INVALID, "This ticket can no longer be re-sent.");
    }
    dispatcher.dispatch(submission.getId()); // async; no preceding write to await
    return new RegistrationResponse(
        submission.getId(),
        submission.getQrStatus(),
        dispatcher.ticketUrl(checkinToken),
        "We've re-sent your QR ticket to " + submission.getGuestEmail() + ".");
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  private static PublicEventResponse toPublicEvent(Event event, long registeredCount) {
    return new PublicEventResponse(
        event.getId(),
        event.getSlug(),
        event.getTitle(),
        event.getCategory(),
        event.getDescription(),
        event.getVenue(),
        event.getCoverColor(),
        event.getCoverImageUrl(),
        event.getStartsAt(),
        event.getEndsAt(),
        event.getCapacity(),
        registeredCount);
  }

  private static String blankToNull(String s) {
    return (s == null || s.isBlank()) ? null : s.trim();
  }

  private PublicFormResponse publicForm(Event event) {
    if (event.getStatus() != EventStatus.PUBLIC) {
      throw notFound();
    }
    RegistrationForm form = activeForm(event.getId());
    return new PublicFormResponse(
        event.getId(),
        event.getSlug(),
        event.getTitle(),
        form.getTitle(),
        schemaCodec.read(form.getSchema()));
  }

  private RegistrationForm activeForm(UUID eventId) {
    RegistrationForm form = formRepository.findByEventId(eventId).orElse(null);
    if (form == null || form.getStatus() != FormStatus.ACTIVE) {
      throw new ApiException(
          ErrorCode.NO_ACTIVE_FORM, "This event has no active registration form.");
    }
    return form;
  }

  private void dispatchAfterCommit(UUID submissionId) {
    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronization() {
          @Override
          public void afterCommit() {
            dispatcher.dispatch(submissionId);
          }
        });
  }

  private void opsRegisterAfterCommit(UUID submissionId) {
    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronization() {
          @Override
          public void afterCommit() {
            opsNotificationService.pushRegistration(submissionId);
          }
        });
  }

  private String valueOfType(
      List<FormField> fields, Map<String, Object> answers, FormFieldType type) {
    return fields.stream()
        .filter(f -> f.type() == type)
        .map(f -> answers.get(f.key()))
        .filter(java.util.Objects::nonNull)
        .map(Object::toString)
        .findFirst()
        .orElseThrow(
            () ->
                new ApiException(
                    ErrorCode.VALIDATION_ERROR,
                    "A " + type.json() + " field is required to register."));
  }

  private String guestName(List<FormField> fields, Map<String, Object> answers) {
    return fields.stream()
        .filter(f -> f.key().equalsIgnoreCase("full_name") || f.key().equalsIgnoreCase("name"))
        .map(f -> answers.get(f.key()))
        .filter(java.util.Objects::nonNull)
        .map(Object::toString)
        .findFirst()
        .orElse(null);
  }

  private String writeAnswers(Map<String, Object> answers) {
    return objectMapper.writeValueAsString(answers);
  }

  private String newToken() {
    byte[] bytes = new byte[24];
    random.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private static ApiException notFound() {
    return new ApiException(ErrorCode.NOT_FOUND, "Event not found.");
  }
}
