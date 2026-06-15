package com.gatherly.service;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.FormTemplate;
import com.gatherly.dto.form.FormField;
import com.gatherly.dto.form.FormTemplateRequest;
import com.gatherly.dto.form.FormTemplateResponse;
import com.gatherly.repository.FormTemplateRepository;
import com.gatherly.security.UserPrincipal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link FormTemplateService} implementation. Templates are org-wide and not event-scoped, so the
 * gate is the global role (ADMIN or SUB_ADMIN) rather than {@code @eventSecurity}. The JSONB schema
 * is validated with the same rules as an event form ({@code docs/02} §6.1).
 */
@Service
public class FormTemplateServiceImpl implements FormTemplateService {

  private static final String NOT_FOUND = "Template not found.";

  private final FormTemplateRepository templateRepository;
  private final FormSchemaCodec schemaCodec;

  public FormTemplateServiceImpl(
      FormTemplateRepository templateRepository, FormSchemaCodec schemaCodec) {
    this.templateRepository = templateRepository;
    this.schemaCodec = schemaCodec;
  }

  @Override
  @PreAuthorize("hasAnyRole('ADMIN', 'SUB_ADMIN')")
  @Transactional(readOnly = true)
  public List<FormTemplateResponse> list() {
    return templateRepository.findAllByOrderByUpdatedAtDesc().stream().map(this::toResponse).toList();
  }

  @Override
  @PreAuthorize("hasAnyRole('ADMIN', 'SUB_ADMIN')")
  @Transactional(readOnly = true)
  public FormTemplateResponse get(UUID templateId) {
    return toResponse(load(templateId));
  }

  @Override
  @PreAuthorize("hasAnyRole('ADMIN', 'SUB_ADMIN')")
  @Transactional
  public FormTemplateResponse create(FormTemplateRequest request, UserPrincipal principal) {
    validateSchema(request.fields());
    FormTemplate template = new FormTemplate();
    template.setCreatedBy(principal.id());
    apply(template, request);
    return toResponse(templateRepository.save(template));
  }

  @Override
  @PreAuthorize("hasAnyRole('ADMIN', 'SUB_ADMIN')")
  @Transactional
  public FormTemplateResponse update(UUID templateId, FormTemplateRequest request) {
    validateSchema(request.fields());
    FormTemplate template = load(templateId);
    apply(template, request);
    return toResponse(templateRepository.save(template));
  }

  @Override
  @PreAuthorize("hasAnyRole('ADMIN', 'SUB_ADMIN')")
  @Transactional
  public void delete(UUID templateId) {
    if (!templateRepository.existsById(templateId)) {
      throw new ApiException(ErrorCode.NOT_FOUND, NOT_FOUND);
    }
    templateRepository.deleteById(templateId);
  }

  private FormTemplate load(UUID templateId) {
    return templateRepository
        .findById(templateId)
        .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, NOT_FOUND));
  }

  private void apply(FormTemplate template, FormTemplateRequest request) {
    template.setName(request.name());
    template.setEventType(request.eventType());
    template.setTitle(request.title());
    template.setSchema(schemaCodec.write(request.fields()));
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

  private FormTemplateResponse toResponse(FormTemplate template) {
    return new FormTemplateResponse(
        template.getId(),
        template.getName(),
        template.getEventType(),
        template.getTitle(),
        schemaCodec.read(template.getSchema()),
        template.getCreatedAt(),
        template.getUpdatedAt());
  }
}
