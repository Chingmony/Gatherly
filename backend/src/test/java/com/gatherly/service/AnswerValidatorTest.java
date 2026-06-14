package com.gatherly.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.fail;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.FormFieldType;
import com.gatherly.dto.form.FormField;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

/** Unit tests for server-side answer validation against the form schema ({@code docs/07} §3). */
class AnswerValidatorTest {

  private final AnswerValidator validator = new AnswerValidator();

  private final List<FormField> schema =
      List.of(
          new FormField("email", "Email", FormFieldType.EMAIL, true, 1, null, null),
          new FormField("phone", "Phone", FormFieldType.PHONE, true, 2, null, null),
          new FormField("name", "Name", FormFieldType.TEXT, false, 3, null, null));

  @Test
  void validAnswersPass() {
    assertThatCode(
            () ->
                validator.validate(
                    Map.of("email", "dara@example.com", "phone", "+855 12 345 678", "name", "Dara"),
                    schema))
        .doesNotThrowAnyException();
  }

  @Test
  void missingRequiredFieldIsRejected() {
    ApiException ex =
        catchValidation(() -> validator.validate(Map.of("email", "dara@example.com"), schema));
    assertThat(ex.getFieldErrors())
        .anyMatch(f -> f.field().equals("phone") && f.code().equals("REQUIRED"));
  }

  @Test
  void unknownKeyIsRejected() {
    ApiException ex =
        catchValidation(
            () ->
                validator.validate(
                    Map.of("email", "d@e.com", "phone", "12345678", "surprise", "x"), schema));
    assertThat(ex.getFieldErrors())
        .anyMatch(f -> f.field().equals("surprise") && f.code().equals("UNKNOWN"));
  }

  @Test
  void invalidEmailFormatIsRejected() {
    ApiException ex =
        catchValidation(
            () -> validator.validate(Map.of("email", "not-an-email", "phone", "12345678"), schema));
    assertThat(ex.getFieldErrors())
        .anyMatch(f -> f.field().equals("email") && f.code().equals("PATTERN"));
  }

  private ApiException catchValidation(Runnable r) {
    try {
      r.run();
    } catch (ApiException ex) {
      assertThat(ex.getCode()).isEqualTo(ErrorCode.VALIDATION_ERROR);
      return ex;
    }
    return fail("Expected a VALIDATION_ERROR ApiException");
  }
}
