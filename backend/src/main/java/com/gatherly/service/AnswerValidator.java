package com.gatherly.service;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.error.FieldErrorDetail;
import com.gatherly.dto.form.FormField;
import com.gatherly.dto.form.FormFieldValidation;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * Authoritative server-side validation of guest answers against the stored form schema ({@code
 * docs/07} §3): required presence, unknown-key rejection, type conformance, per-field constraints,
 * and {@code select} options. Failures aggregate into field errors (no partial writes).
 */
@Component
public class AnswerValidator {

  private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
  private static final Pattern PHONE = Pattern.compile("^[0-9+\\-\\s()]{7,20}$");

  public void validate(Map<String, Object> answers, List<FormField> schema) {
    List<FieldErrorDetail> errors = new ArrayList<>();
    Map<String, FormField> byKey =
        schema.stream().collect(Collectors.toMap(FormField::key, f -> f));

    for (String key : answers.keySet()) {
      if (!byKey.containsKey(key)) {
        errors.add(new FieldErrorDetail(key, "UNKNOWN", "Unknown field."));
      }
    }

    for (FormField field : schema) {
      Object value = answers.get(field.key());
      if (isEmpty(value)) {
        if (field.required()) {
          errors.add(new FieldErrorDetail(field.key(), "REQUIRED", "This field is required."));
        }
        continue;
      }
      validateValue(field, value, errors);
    }

    if (!errors.isEmpty()) {
      throw new ApiException(
          ErrorCode.VALIDATION_ERROR, "One or more answers are invalid.", errors);
    }
  }

  private void validateValue(FormField field, Object value, List<FieldErrorDetail> errors) {
    switch (field.type()) {
      case EMAIL -> {
        if (!EMAIL.matcher(value.toString()).matches()) {
          errors.add(new FieldErrorDetail(field.key(), "PATTERN", "Enter a valid email address."));
        }
      }
      case PHONE -> {
        if (!PHONE.matcher(value.toString()).matches()) {
          errors.add(new FieldErrorDetail(field.key(), "PATTERN", "Enter a valid phone number."));
        }
      }
      case NUMBER -> {
        if (asNumber(value) == null) {
          errors.add(new FieldErrorDetail(field.key(), "TYPE", "Must be a number."));
        }
      }
      case DATE -> {
        if (!isIsoDate(value.toString())) {
          errors.add(new FieldErrorDetail(field.key(), "TYPE", "Must be a valid date."));
        }
      }
      case SELECT -> requireOption(field, value.toString(), errors);
      case MULTISELECT -> {
        if (value instanceof Collection<?> values) {
          values.forEach(v -> requireOption(field, String.valueOf(v), errors));
        } else {
          errors.add(new FieldErrorDetail(field.key(), "TYPE", "Must be a list of options."));
        }
      }
      case CHECKBOX -> {
        if (!(value instanceof Boolean)) {
          errors.add(new FieldErrorDetail(field.key(), "TYPE", "Must be true or false."));
        }
      }
      default -> {
        /* TEXT / TEXTAREA — no type constraint */
      }
    }
    applyConstraints(field, value, errors);
  }

  private void applyConstraints(FormField field, Object value, List<FieldErrorDetail> errors) {
    FormFieldValidation v = field.validation();
    if (v == null) {
      return;
    }
    String text = value.toString();
    if (v.minLength() != null && text.length() < v.minLength()) {
      errors.add(
          new FieldErrorDetail(
              field.key(), "MIN_LENGTH", "Must be at least " + v.minLength() + " characters."));
    }
    if (v.maxLength() != null && text.length() > v.maxLength()) {
      errors.add(
          new FieldErrorDetail(
              field.key(), "MAX_LENGTH", "Must be at most " + v.maxLength() + " characters."));
    }
    Double number = asNumber(value);
    if (v.min() != null && number != null && number < v.min()) {
      errors.add(new FieldErrorDetail(field.key(), "MIN", "Must be at least " + v.min() + "."));
    }
    if (v.max() != null && number != null && number > v.max()) {
      errors.add(new FieldErrorDetail(field.key(), "MAX", "Must be at most " + v.max() + "."));
    }
    if (v.pattern() != null && !Pattern.compile(v.pattern()).matcher(text).matches()) {
      errors.add(new FieldErrorDetail(field.key(), "PATTERN", "Invalid format."));
    }
  }

  private void requireOption(FormField field, String value, List<FieldErrorDetail> errors) {
    if (field.options() == null || !field.options().contains(value)) {
      errors.add(new FieldErrorDetail(field.key(), "OPTION", "Not an allowed option."));
    }
  }

  private static boolean isEmpty(Object value) {
    return value == null
        || (value instanceof String s && s.isBlank())
        || (value instanceof Collection<?> c && c.isEmpty());
  }

  private static Double asNumber(Object value) {
    if (value instanceof Number n) {
      return n.doubleValue();
    }
    try {
      return Double.parseDouble(value.toString());
    } catch (NumberFormatException e) {
      return null;
    }
  }

  private static boolean isIsoDate(String value) {
    try {
      java.time.LocalDate.parse(value);
      return true;
    } catch (DateTimeParseException e) {
      return false;
    }
  }
}
