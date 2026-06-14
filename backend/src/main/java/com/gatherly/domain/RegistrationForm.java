package com.gatherly.domain;

import com.gatherly.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Dynamic registration form, 1:1 with an event ({@code docs/02} §3.9). {@code schema} is the JSONB
 * ordered field-definition array — the single source consumed by the FE renderer and BE validator.
 * Editable while {@code DRAFT}; locked once {@code ACTIVE}.
 */
@Entity
@Table(name = "registration_form")
@Getter
@Setter
@NoArgsConstructor
public class RegistrationForm extends BaseEntity {

  @Column(name = "event_id", nullable = false, unique = true)
  private UUID eventId;

  @Column(nullable = false)
  private String title;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private FormStatus status = FormStatus.DRAFT;

  /** Ordered field-definition array, stored as JSONB. */
  @JdbcTypeCode(SqlTypes.JSON)
  @Column(nullable = false, columnDefinition = "jsonb")
  private String schema = "[]";

  @Column(nullable = false)
  private int version = 1;

  @Column(name = "created_by")
  private UUID createdBy;
}
