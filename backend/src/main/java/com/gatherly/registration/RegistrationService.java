package com.gatherly.registration;

import com.gatherly.common.error.ApiFieldError;
import com.gatherly.common.error.DomainConflictException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.error.FormValidationException;
import com.gatherly.common.error.NotFoundException;
import com.gatherly.event.EventRepository;
import com.gatherly.event.domain.Event;
import com.gatherly.event.domain.EventStatus;
import com.gatherly.form.FormSchemaValidator;
import com.gatherly.form.RegistrationFormRepository;
import com.gatherly.form.domain.FormStatus;
import com.gatherly.form.domain.RegistrationForm;
import com.gatherly.registration.domain.RegistrationSubmission;
import com.gatherly.registration.domain.TicketStatus;
import com.gatherly.registration.dto.PublicEventCard;
import com.gatherly.registration.dto.PublicTicketResponse;
import com.gatherly.registration.dto.RegisterRequest;
import com.gatherly.registration.dto.RegisterResponse;
import com.gatherly.registration.dto.SubmissionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Public guest registration → per-guest QR ticket (docs/06 §6, docs/03 §4.9). Validates answers
 * against the active form schema (docs/07 §3), enforces capacity + one-ticket-per-email, and mints
 * a CSPRNG {@code checkin_token}. This slice persists the ticket as {@code PENDING} and returns it
 * for on-screen QR display; email delivery + organizer scan are later slices.
 */
@Service
@Transactional
public class RegistrationService {

    private static final TypeReference<LinkedHashMap<String, JsonNode>> ANSWER_MAP = new TypeReference<>() {
    };
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Base64.Encoder URL64 = Base64.getUrlEncoder().withoutPadding();

    private final EventRepository events;
    private final RegistrationFormRepository forms;
    private final RegistrationSubmissionRepository submissions;
    private final JsonMapper json;
    private final String publicBaseUrl;

    public RegistrationService(EventRepository events, RegistrationFormRepository forms,
                               RegistrationSubmissionRepository submissions, JsonMapper json,
                               @Value("${gatherly.app.public-base-url:http://localhost:3000}") String publicBaseUrl) {
        this.events = events;
        this.forms = forms;
        this.submissions = submissions;
        this.json = json;
        this.publicBaseUrl = publicBaseUrl.replaceAll("/$", "");
    }

    // ---- Public surface (unauthenticated, docs/03 §4.9) ---------------------

    @Transactional(readOnly = true)
    public List<PublicEventCard> listPublicEvents() {
        List<Event> publicEvents = events.findByStatusOrderByStartsAtAsc(EventStatus.PUBLIC);
        if (publicEvents.isEmpty()) {
            return List.of();
        }
        // Single grouped count instead of N per-event counts (homepage hot path).
        Map<UUID, Long> counts = submissions
                .countByEventIds(publicEvents.stream().map(Event::getId).toList()).stream()
                .collect(java.util.stream.Collectors.toMap(
                        RegistrationSubmissionRepository.EventSubmissionCount::getEventId,
                        RegistrationSubmissionRepository.EventSubmissionCount::getCnt));
        return publicEvents.stream()
                .map(e -> new PublicEventCard(e.getId(), e.getSlug(), e.getTitle(), e.getCategory(),
                        e.getVenue(), e.getStartsAt(), e.getCoverGradient(), e.getCoverImageKey(),
                        counts.getOrDefault(e.getId(), 0L), e.getCapacity()))
                .toList();
    }

    public RegisterResponse register(UUID eventId, RegisterRequest req) {
        Event event = events.findById(eventId)
                .filter(e -> e.getStatus() == EventStatus.PUBLIC)
                .orElseThrow(() -> new NotFoundException("Event not found.")); // don't leak non-public
        RegistrationForm form = forms.findByEventId(eventId)
                .filter(f -> f.getStatus() == FormStatus.ACTIVE)
                .orElseThrow(() -> new DomainConflictException(ErrorCode.NO_ACTIVE_FORM,
                        "Registration is not open for this event."));

        JsonNode schema = json.readTree(form.getSchema());
        Map<String, JsonNode> answers = json.convertValue(req.answers(), ANSWER_MAP);
        List<ApiFieldError> errors = FormSchemaValidator.validate(schema, answers);
        if (!errors.isEmpty()) {
            throw new FormValidationException(errors);
        }

        String email = valueOfType(schema, answers, "email");
        String phone = valueOfType(schema, answers, "phone");
        String name = firstNonNull(text(answers.get("full_name")), text(answers.get("name")));

        if (event.getCapacity() != null && submissions.countByEventId(eventId) >= event.getCapacity()) {
            throw new DomainConflictException(ErrorCode.CONFLICT, "This event is full.");
        }
        if (submissions.existsByEventIdAndGuestEmailIgnoreCase(eventId, email)) {
            throw new DomainConflictException(ErrorCode.CONFLICT,
                    "This email is already registered for this event.");
        }

        RegistrationSubmission sub = new RegistrationSubmission();
        sub.setFormId(form.getId());
        sub.setEventId(eventId);
        sub.setAnswers(json.writeValueAsString(req.answers()));
        sub.setGuestEmail(email);
        sub.setGuestPhone(phone);
        sub.setGuestName(name);
        sub.setCheckinToken(newToken());
        sub.setQrStatus(TicketStatus.PENDING);
        sub.setFormVersion(form.getVersion());
        try {
            sub = submissions.save(sub);
        } catch (DataIntegrityViolationException race) {
            // UNIQUE(event_id, guest_email) / checkin_token race → conflict.
            throw new DomainConflictException(ErrorCode.CONFLICT,
                    "This email is already registered for this event.");
        }

        String ticketUrl = publicBaseUrl + "/tickets/" + sub.getCheckinToken();
        return new RegisterResponse(sub.getId(), sub.getQrStatus().name(), sub.getCheckinToken(),
                ticketUrl, "You're registered for " + event.getTitle()
                + ". Show this QR at the entrance — an organizer will scan it to confirm your attendance.");
    }

    @Transactional(readOnly = true)
    public PublicTicketResponse ticket(String checkinToken) {
        RegistrationSubmission sub = submissions.findByCheckinToken(checkinToken)
                .orElseThrow(() -> new NotFoundException("Ticket not found."));
        Event event = events.findById(sub.getEventId())
                .orElseThrow(() -> new NotFoundException("Ticket not found."));
        return new PublicTicketResponse(sub.getCheckinToken(), sub.getGuestName(), event.getTitle(),
                event.getVenue(), event.getStartsAt(), sub.getQrStatus().name());
    }

    // ---- Organizer "Manage Guests" (docs/03 §4.8) ---------------------------

    @PreAuthorize("@eventSecurity.canView(#eventId, authentication)")
    @Transactional(readOnly = true)
    public Page<SubmissionResponse> listSubmissions(UUID eventId, Pageable pageable) {
        if (!events.existsById(eventId)) {
            throw new NotFoundException("Event not found.");
        }
        return submissions.findByEventId(eventId, pageable)
                .map(s -> new SubmissionResponse(s.getId(), s.getGuestName(), s.getGuestEmail(),
                        s.getGuestPhone(), s.getQrStatus(), s.getSubmittedAt()));
    }

    // ---- helpers -------------------------------------------------------------

    /** Read the answer for the (first) schema field of the given type — promotes email/phone. */
    private String valueOfType(JsonNode schema, Map<String, JsonNode> answers, String type) {
        if (schema != null && schema.isArray()) {
            for (JsonNode field : schema) {
                if (type.equals(field.path("type").asString(""))) {
                    return text(answers.get(field.path("key").asString("")));
                }
            }
        }
        return text(answers.get(type)); // fallback to a conventionally-keyed field
    }

    private static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return "tkt_" + URL64.encodeToString(bytes);
    }

    private static String text(JsonNode node) {
        return node == null ? null : node.asString("");
    }

    private static String firstNonNull(String a, String b) {
        return (a != null && !a.isBlank()) ? a : b;
    }
}
