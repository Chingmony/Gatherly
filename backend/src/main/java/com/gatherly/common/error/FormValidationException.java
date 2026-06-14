package com.gatherly.common.error;

import java.util.List;

/**
 * Dynamic-form (JSONB) validation failure → {@code 400 VALIDATION_ERROR} with aggregated
 * {@code fieldErrors} (docs/07 §3, §5). Used by {@code RegistrationService} from M6; defined
 * in M0 so the error contract is complete from the start.
 */
public class FormValidationException extends AppException {

    private final List<ApiFieldError> fieldErrors;

    public FormValidationException(List<ApiFieldError> fieldErrors) {
        super(ErrorCode.VALIDATION_ERROR, "One or more fields are invalid.");
        this.fieldErrors = List.copyOf(fieldErrors);
    }

    public List<ApiFieldError> fieldErrors() {
        return fieldErrors;
    }
}
