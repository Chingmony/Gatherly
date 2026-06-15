package com.gatherly.domain;

import com.gatherly.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Reusable registration-form template, not bound to an event. The form builder designs these so an
 * event's {@link RegistrationForm} can be seeded from one. {@code schema} is the same ordered JSONB
 * field-definition array as {@link RegistrationForm} ({@code docs/02} §6.1).
 */
@Entity
@Table(name = "form_template")
@Getter
@Setter
@NoArgsConstructor
public class FormTemplate extends BaseEntity {

  @Column(nullable = false)
  private String name;

  /** Free-form event category this template targets (e.g. "Conference", "Workshop"). */
  @Column(name = "event_type", nullable = false)
  private String eventType;

  @Column(nullable = false)
  private String title;

  /** Ordered field-definition array, stored as JSONB. */
  @JdbcTypeCode(SqlTypes.JSON)
  @Column(nullable = false, columnDefinition = "jsonb")
  private String schema = "[]";

  @Column(name = "created_by")
  private UUID createdBy;
}
