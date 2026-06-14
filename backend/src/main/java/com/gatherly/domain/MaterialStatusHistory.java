package com.gatherly.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Append-only audit row written on every material transition ({@code docs/02} §3.7). {@code
 * fromStatus} is null on creation. Does not extend {@code BaseEntity}: no {@code updated_at}.
 */
@Entity
@Table(name = "material_status_history")
@Getter
@Setter
@NoArgsConstructor
public class MaterialStatusHistory {

  @Id @GeneratedValue private UUID id;

  @Column(name = "material_id", nullable = false)
  private UUID materialId;

  @Enumerated(EnumType.STRING)
  @Column(name = "from_status")
  private MaterialStatus fromStatus;

  @Enumerated(EnumType.STRING)
  @Column(name = "to_status", nullable = false)
  private MaterialStatus toStatus;

  @Column(name = "changed_by")
  private UUID changedBy;

  @Column private String note;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false, nullable = false)
  private Instant createdAt;
}
