package com.gatherly.service;

import com.gatherly.dto.form.FormResponse;
import com.gatherly.dto.form.FormSchemaRequest;
import com.gatherly.security.UserPrincipal;
import java.util.UUID;

/** Dynamic form builder/activation ({@code docs/03} §4.8, {@code docs/06} §3). */
public interface RegistrationFormService {

  FormResponse get(UUID eventId);

  /** Create-or-edit the form schema; allowed only while DRAFT. */
  FormResponse save(UUID eventId, FormSchemaRequest request, UserPrincipal principal);

  /** Activate the form; requires a required email field and a required phone field. */
  FormResponse activate(UUID eventId);
}
