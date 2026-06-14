package com.gatherly.service;

import com.gatherly.dto.form.FormField;
import java.util.List;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/**
 * (De)serializes the JSONB form schema between its stored string form and typed {@link FormField}
 * definitions. One codec shared by the form builder (M5) and the registration validator (M6) so the
 * schema stays a single source of truth ({@code docs/02} §6.1).
 */
@Component
public class FormSchemaCodec {

  private static final TypeReference<List<FormField>> FIELD_LIST = new TypeReference<>() {};

  private final ObjectMapper objectMapper;

  public FormSchemaCodec(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public String write(List<FormField> fields) {
    return objectMapper.writeValueAsString(fields);
  }

  public List<FormField> read(String json) {
    if (json == null || json.isBlank()) {
      return List.of();
    }
    return objectMapper.readValue(json, FIELD_LIST);
  }
}
