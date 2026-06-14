package com.gatherly.form.domain;

/**
 * Registration-form lifecycle (docs/02 §3.9). Editable while {@code DRAFT}; once {@code ACTIVE} the
 * schema is locked (field keys are immutable because submissions reference them by key).
 */
public enum FormStatus {
    DRAFT,
    ACTIVE,
    INACTIVE
}
