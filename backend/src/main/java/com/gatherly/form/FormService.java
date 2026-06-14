package com.gatherly.form;

import com.gatherly.common.error.AppException;
import com.gatherly.common.error.DomainConflictException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.error.NotFoundException;
import com.gatherly.event.EventRepository;
import com.gatherly.event.domain.Event;
import com.gatherly.event.domain.EventStatus;
import com.gatherly.form.domain.FormStatus;
import com.gatherly.form.domain.RegistrationForm;
import com.gatherly.form.dto.FormResponse;
import com.gatherly.form.dto.PublicFormResponse;
import com.gatherly.form.dto.UpdateFormRequest;
import com.gatherly.security.UserPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.UUID;

/**
 * Registration-form builder (docs/06 §3, docs/03 §4.8). Event-scoped gates ({@code canView}/
 * {@code canManage}) live here on the service layer. The schema is JSONB (Zero-Migration Forms):
 * editable while DRAFT, locked once ACTIVE, and activation requires a <b>required email + required
 * phone</b> field (docs/02 §6.1, docs/07 §3) so every ticket has a delivery address + phone.
 */
@Service
@Transactional
public class FormService {

    private final RegistrationFormRepository forms;
    private final EventRepository events;
    private final JsonMapper json;

    public FormService(RegistrationFormRepository forms, EventRepository events, JsonMapper json) {
        this.forms = forms;
        this.events = events;
        this.json = json;
    }

    @PreAuthorize("@eventSecurity.canView(#eventId, authentication)")
    @Transactional(readOnly = true)
    public FormResponse getForm(UUID eventId) {
        requireEvent(eventId);
        RegistrationForm form = forms.findByEventId(eventId)
                .orElseThrow(() -> new NotFoundException("This event has no registration form yet."));
        return toResponse(form);
    }

    /** Create-or-edit the form (docs/03 §4.8). Blocked once ACTIVE (schema is then locked). */
    @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
    public FormResponse saveForm(UUID eventId, UpdateFormRequest req, UserPrincipal actor) {
        requireEvent(eventId);
        RegistrationForm form = forms.findByEventId(eventId).orElse(null);
        if (form != null && form.getStatus() == FormStatus.ACTIVE) {
            throw new DomainConflictException(ErrorCode.CONFLICT,
                    "An active form is locked; deactivate it before editing the schema.");
        }
        if (form == null) {
            form = new RegistrationForm();
            form.setEventId(eventId);
            form.setVersion(1);
            form.setCreatedBy(actor == null ? null : actor.id());
        } else {
            form.setVersion(form.getVersion() + 1); // bump on every schema change (docs/02 §3.9)
        }
        form.setTitle(req.title() == null || req.title().isBlank() ? "Registration" : req.title());
        form.setSchema(json.writeValueAsString(req.schema()));
        return toResponse(forms.save(form));
    }

    /** Activate the form (docs/03 §4.8) — re-checks the mandatory email + phone fields server-side. */
    @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
    public FormResponse activate(UUID eventId) {
        requireEvent(eventId);
        RegistrationForm form = forms.findByEventId(eventId)
                .orElseThrow(() -> new NotFoundException("This event has no registration form yet."));
        JsonNode schema = json.readTree(form.getSchema());
        if (!hasRequired(schema, "email") || !hasRequired(schema, "phone")) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "An active form must include a required email field and a required phone field.");
        }
        form.setStatus(FormStatus.ACTIVE);
        return toResponse(forms.save(form));
    }

    /** Public render-only active form for a guest (docs/03 §4.9). PUBLIC event + ACTIVE form, else 404. */
    @Transactional(readOnly = true)
    public PublicFormResponse publicActiveForm(String slug) {
        Event event = events.findBySlug(slug)
                .filter(e -> e.getStatus() == EventStatus.PUBLIC)
                .orElseThrow(() -> new NotFoundException("Event not found."));
        RegistrationForm form = forms.findByEventId(event.getId())
                .filter(f -> f.getStatus() == FormStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException("Registration is not open for this event."));
        return new PublicFormResponse(event.getId(), event.getTitle(), form.getTitle(),
                json.readTree(form.getSchema()), form.getVersion());
    }

    // ---- helpers -------------------------------------------------------------

    /** True if the schema contains a field of {@code type} with {@code required:true}. */
    private boolean hasRequired(JsonNode schema, String type) {
        if (schema == null || !schema.isArray()) {
            return false;
        }
        for (JsonNode field : schema) {
            if (type.equals(field.path("type").asString("")) && field.path("required").asBoolean(false)) {
                return true;
            }
        }
        return false;
    }

    private FormResponse toResponse(RegistrationForm f) {
        return new FormResponse(f.getId(), f.getEventId(), f.getTitle(), f.getStatus(),
                json.readTree(f.getSchema()), f.getVersion(), f.getCreatedAt(), f.getUpdatedAt());
    }

    private void requireEvent(UUID eventId) {
        if (!events.existsById(eventId)) {
            throw new NotFoundException("Event not found.");
        }
    }
}
