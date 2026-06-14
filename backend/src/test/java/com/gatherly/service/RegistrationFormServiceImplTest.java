package com.gatherly.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.FormFieldType;
import com.gatherly.domain.FormStatus;
import com.gatherly.domain.GlobalRole;
import com.gatherly.domain.RegistrationForm;
import com.gatherly.dto.form.FormField;
import com.gatherly.dto.form.FormSchemaRequest;
import com.gatherly.repository.EventRepository;
import com.gatherly.repository.RegistrationFormRepository;
import com.gatherly.security.UserPrincipal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.json.JsonMapper;

/** Unit tests for form activation rules (require email+phone) and the DRAFT-only edit lock. */
@ExtendWith(MockitoExtension.class)
class RegistrationFormServiceImplTest {

  @Mock private RegistrationFormRepository formRepository;
  @Mock private EventRepository eventRepository;

  private final FormSchemaCodec codec = new FormSchemaCodec(new JsonMapper());
  private RegistrationFormServiceImpl service;
  private final UserPrincipal principal =
      new UserPrincipal(UUID.randomUUID(), "a@example.com", GlobalRole.ADMIN);

  @BeforeEach
  void setUp() {
    service = new RegistrationFormServiceImpl(formRepository, eventRepository, codec);
    lenient()
        .when(formRepository.save(any(RegistrationForm.class)))
        .thenAnswer(i -> i.getArgument(0));
  }

  private FormField field(String key, FormFieldType type, boolean required) {
    return new FormField(key, key, type, required, 1, null, null);
  }

  private RegistrationForm formWith(List<FormField> fields, FormStatus status) {
    RegistrationForm f = new RegistrationForm();
    f.setEventId(UUID.randomUUID());
    f.setTitle("Reg");
    f.setStatus(status);
    f.setSchema(codec.write(fields));
    return f;
  }

  @Test
  void activateRejectsFormMissingEmailOrPhone() {
    when(formRepository.findByEventId(any()))
        .thenReturn(
            Optional.of(
                formWith(List.of(field("name", FormFieldType.TEXT, true)), FormStatus.DRAFT)));

    assertThatThrownBy(() -> service.activate(UUID.randomUUID()))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getCode())
        .isEqualTo(ErrorCode.VALIDATION_ERROR);
  }

  @Test
  void activateSucceedsWithRequiredEmailAndPhone() {
    RegistrationForm form =
        formWith(
            List.of(
                field("email", FormFieldType.EMAIL, true),
                field("phone", FormFieldType.PHONE, true)),
            FormStatus.DRAFT);
    when(formRepository.findByEventId(any())).thenReturn(Optional.of(form));

    service.activate(UUID.randomUUID());

    assertThat(form.getStatus()).isEqualTo(FormStatus.ACTIVE);
  }

  @Test
  void savingAnActiveFormIsRejected() {
    when(eventRepository.existsById(any())).thenReturn(true);
    when(formRepository.findByEventId(any()))
        .thenReturn(
            Optional.of(
                formWith(List.of(field("email", FormFieldType.EMAIL, true)), FormStatus.ACTIVE)));
    FormSchemaRequest request =
        new FormSchemaRequest("Reg", List.of(field("name", FormFieldType.TEXT, false)));

    assertThatThrownBy(() -> service.save(UUID.randomUUID(), request, principal))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getCode())
        .isEqualTo(ErrorCode.CONFLICT);
  }
}
