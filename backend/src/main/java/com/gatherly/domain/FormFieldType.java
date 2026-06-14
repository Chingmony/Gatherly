package com.gatherly.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Dynamic-form field type ({@code docs/02} §6.1). Serialized lowercase in the JSONB schema (the
 * single source of truth shared by the FE renderer and BE validator).
 */
public enum FormFieldType {
  TEXT,
  EMAIL,
  PHONE,
  NUMBER,
  DATE,
  SELECT,
  MULTISELECT,
  CHECKBOX,
  TEXTAREA;

  @JsonValue
  public String json() {
    return name().toLowerCase();
  }

  @JsonCreator
  public static FormFieldType from(String value) {
    return valueOf(value.trim().toUpperCase());
  }

  public boolean requiresOptions() {
    return this == SELECT || this == MULTISELECT;
  }
}
