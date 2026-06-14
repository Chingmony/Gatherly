package com.gatherly.service;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.FormFieldType;
import com.gatherly.domain.FormStatus;
import com.gatherly.domain.RegistrationForm;
import com.gatherly.dto.form.FormField;
import com.gatherly.dto.form.FormResponse;
import com.gatherly.dto.form.FormSchemaRequest;
import com.gatherly.repository.EventRepository;
import com.gatherly.repository.RegistrationFormRepository;
import com.gatherly.security.UserPrincipal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link RegistrationFormService} implementation. Editing is gated by {@code canManage} and allowed
 * only while DRAFT; activation requires the mandatory required {@code email} + {@code phone} fields
 * ({@code docs/02} §6, {@code docs/07} §3).
 */
@Service
public class RegistrationFormServiceImpl implements RegistrationFormService {

  private final RegistrationFormRepository formRepository;
  private final EventRepository eventRepository;
  private final FormSchemaCodec schemaCodec;

  public RegistrationFormServiceImpl(
      RegistrationFormRepository formRepository,
      EventRepository eventRepository,
      FormSchemaCodec schemaCodec) {
    this.formRepository = formRepository;
    this.eventRepository = eventRepository;
    this.schemaCodec = schemaCodec;
  }

  @Override
  @PreAuthorize("@eventSecurity.canView(#eventId, authentication)")
  @Transactional(readOnly = true)
  public FormResponse get(UUID eventId) {
    return toResponse(load(eventId));
  }

  @Override
  @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
  @Transactional
  public FormResponse save(UUID eventId, FormSchemaRequest request, UserPrincipal principal) {
    if (!eventRepository.existsById(eventId)) {
      throw new ApiException(ErrorCode.NOT_FOUND, "Event not found.");
    }
    validateSchema(request.fields());
    RegistrationForm form = formRepository.findByEventId(eventId).orElse(null);
    if (form == null) {
      form = new RegistrationForm();
      form.setEventId(eventId);
      form.setCreatedBy(principal.id());
    } else if (form.getStatus() == FormStatus.ACTIVE) {
      throw new ApiException(
          ErrorCode.CONFLICT, "The form is active and its schema is locked. Deactivate to edit.");
    }
    form.setTitle(request.title());
    form.setSchema(schemaCodec.write(request.fields()));
    form.setStatus(FormStatus.DRAFT);
    return toResponse(formRepository.save(form));
  }

  @Override
  @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
  @Transactional
  public FormResponse activate(UUID eventId) {
    RegistrationForm form = load(eventId);
    List<FormField> fields = schemaCodec.read(form.getSchema());
    if (!hasRequiredField(fields, FormFieldType.EMAIL)
        || !hasRequiredField(fields, FormFieldType.PHONE)) {
      throw new ApiException(
          ErrorCode.VALIDATION_ERROR,
          "An active form must include a required email field and a required phone field.");
    }
    form.setStatus(FormStatus.ACTIVE);
    return toResponse(form);
  }

  private RegistrationForm load(UUID eventId) {
    return formRepository
        .findByEventId(eventId)
        .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "No form exists for this event."));
  }

  private void validateSchema(List<FormField> fields) {
    Set<String> keys = new HashSet<>();
    for (FormField f : fields) {
      if (!keys.add(f.key())) {
        throw new ApiException(ErrorCode.VALIDATION_ERROR, "Duplicate field key: " + f.key());
      }
      if (f.type().requiresOptions() && (f.options() == null || f.options().isEmpty())) {
        throw new ApiException(
            ErrorCode.VALIDATION_ERROR, "Field '" + f.key() + "' requires non-empty options.");
      }
    }
  }

  private static boolean hasRequiredField(List<FormField> fields, FormFieldType type) {
    return fields.stream().anyMatch(f -> f.type() == type && f.required());
  }

  private FormResponse toResponse(RegistrationForm form) {
    return new FormResponse(
        form.getId(),
        form.getEventId(),
        form.getTitle(),
        form.getStatus(),
        form.getVersion(),
        schemaCodec.read(form.getSchema()),
        form.getCreatedAt(),
        form.getUpdatedAt());
  }
}
