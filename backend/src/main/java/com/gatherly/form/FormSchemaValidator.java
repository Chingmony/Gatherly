package com.gatherly.form;

import com.gatherly.common.error.ApiFieldError;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Server-side, authoritative validation of guest answers against a form schema (docs/07 §3,
 * docs/02 §6). Mirrors the FE Zod rules but is the source of truth. Aggregates all failures into
 * field errors (no partial writes). Pure/stateless — unit-testable against schema fixtures.
 */
public final class FormSchemaValidator {

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern PHONE = Pattern.compile("^[0-9+\\-\\s]{7,20}$");

    private FormSchemaValidator() {
    }

    /**
     * @param schema  the form's field-definition array (JSONB, parsed)
     * @param answers the guest's submitted answers, keyed by field {@code key}
     * @return aggregated field errors (empty = valid)
     */
    public static List<ApiFieldError> validate(JsonNode schema, Map<String, JsonNode> answers) {
        List<ApiFieldError> errors = new ArrayList<>();
        Set<String> knownKeys = new LinkedHashSet<>();
        if (schema == null || !schema.isArray()) {
            return errors;
        }

        for (JsonNode field : schema) {
            String key = field.path("key").asString("");
            if (key.isEmpty()) {
                continue;
            }
            knownKeys.add(key);
            String type = field.path("type").asString("text");
            boolean required = field.path("required").asBoolean(false);
            JsonNode value = answers.get(key);
            boolean empty = isEmpty(value);

            if (required && empty) {
                errors.add(new ApiFieldError(key, "REQUIRED", labelOf(field) + " is required."));
                continue;
            }
            if (empty) {
                continue; // optional + absent → fine
            }
            validateType(errors, field, key, type, value);
            validateConstraints(errors, field, key, value);
        }

        // Reject unknown keys (no silent extra data).
        for (String submittedKey : answers.keySet()) {
            if (!knownKeys.contains(submittedKey)) {
                errors.add(new ApiFieldError(submittedKey, "UNKNOWN", "Unexpected field."));
            }
        }
        return errors;
    }

    private static void validateType(List<ApiFieldError> errors, JsonNode field, String key,
                                     String type, JsonNode value) {
        switch (type) {
            case "email" -> {
                if (!EMAIL.matcher(value.asString("")).matches()) {
                    errors.add(new ApiFieldError(key, "PATTERN", "Enter a valid email address."));
                }
            }
            case "phone" -> {
                if (!PHONE.matcher(value.asString("")).matches()) {
                    errors.add(new ApiFieldError(key, "PATTERN", "Enter a valid phone number."));
                }
            }
            case "number" -> {
                if (!value.isNumber() && !isNumeric(value.asString(""))) {
                    errors.add(new ApiFieldError(key, "TYPE", labelOf(field) + " must be a number."));
                }
            }
            case "select" -> {
                if (!optionsContain(field, value.asString(""))) {
                    errors.add(new ApiFieldError(key, "OPTION", "Choose a valid option."));
                }
            }
            case "multiselect" -> {
                if (value.isArray()) {
                    for (JsonNode v : value) {
                        if (!optionsContain(field, v.asString(""))) {
                            errors.add(new ApiFieldError(key, "OPTION", "Choose valid options."));
                            break;
                        }
                    }
                } else {
                    errors.add(new ApiFieldError(key, "TYPE", "Expected a list of options."));
                }
            }
            default -> {
                // text / textarea / date / checkbox — accepted as-is (date format kept lenient in v1)
            }
        }
    }

    private static void validateConstraints(List<ApiFieldError> errors, JsonNode field, String key,
                                            JsonNode value) {
        JsonNode v = field.path("validation");
        if (v.isMissingNode() || v.isNull()) {
            return;
        }
        String s = value.asString("");
        if (v.has("minLength") && s.length() < v.path("minLength").asInt()) {
            errors.add(new ApiFieldError(key, "SIZE", "Too short."));
        }
        if (v.has("maxLength") && s.length() > v.path("maxLength").asInt()) {
            errors.add(new ApiFieldError(key, "SIZE", "Too long."));
        }
        if (v.has("pattern") && !s.isEmpty()) {
            try {
                if (!Pattern.compile(v.path("pattern").asString("")).matcher(s).matches()) {
                    errors.add(new ApiFieldError(key, "PATTERN", "Invalid format."));
                }
            } catch (RuntimeException ignored) {
                // a malformed schema pattern never crashes guest registration
            }
        }
        if (value.isNumber()) {
            double d = value.asDouble();
            if (v.has("min") && d < v.path("min").asDouble()) {
                errors.add(new ApiFieldError(key, "RANGE", "Too small."));
            }
            if (v.has("max") && d > v.path("max").asDouble()) {
                errors.add(new ApiFieldError(key, "RANGE", "Too large."));
            }
        }
    }

    private static boolean optionsContain(JsonNode field, String candidate) {
        JsonNode options = field.path("options");
        if (!options.isArray()) {
            return false;
        }
        for (JsonNode o : options) {
            if (o.asString("").equals(candidate)) {
                return true;
            }
        }
        return false;
    }

    private static boolean isEmpty(JsonNode value) {
        if (value == null || value.isNull()) {
            return true;
        }
        if (value.isString()) {
            return value.asString("").isBlank();
        }
        if (value.isArray()) {
            return value.isEmpty();
        }
        return false;
    }

    private static boolean isNumeric(String s) {
        if (s == null || s.isBlank()) {
            return false;
        }
        try {
            Double.parseDouble(s);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private static String labelOf(JsonNode field) {
        String label = field.path("label").asString("");
        return label.isEmpty() ? "This field" : label;
    }
}
