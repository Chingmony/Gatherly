package com.gatherly.domain;

/**
 * Registration-form lifecycle ({@code docs/02} §4). Editable only while {@code DRAFT}; once {@code
 * ACTIVE} the schema (field keys) is locked because submissions reference fields by key.
 */
public enum FormStatus {
  DRAFT,
  ACTIVE,
  INACTIVE
}
