package com.gatherly.service;

import com.gatherly.dto.form.FormTemplateRequest;
import com.gatherly.dto.form.FormTemplateResponse;
import com.gatherly.security.UserPrincipal;
import java.util.List;
import java.util.UUID;

/** Reusable form-template management for the builder (ADMIN / SUB_ADMIN). */
public interface FormTemplateService {

  List<FormTemplateResponse> list();

  FormTemplateResponse get(UUID templateId);

  FormTemplateResponse create(FormTemplateRequest request, UserPrincipal principal);

  FormTemplateResponse update(UUID templateId, FormTemplateRequest request);

  void delete(UUID templateId);
}
