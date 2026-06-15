package com.gatherly.domain;

import com.gatherly.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Event item/task with workflow state ({@code docs/02} §3.6). {@code assignedTo} drives
 * Handler-scoped authorization ({@code canUpdateMaterial}). Transitions enforced via {@link
 * MaterialStatus}.
 */
@Entity
@Table(name = "material")
@Getter
@Setter
@NoArgsConstructor
public class Material extends BaseEntity {

  @Column(name = "event_id", nullable = false)
  private UUID eventId;

  @Column(name = "catalog_item_id")
  private UUID catalogItemId;

  @Column(nullable = false)
  private String name;

  @Column private String description;

  @Column private Integer quantity;

  @Column(length = 50)
  private String category;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private MaterialPriority priority = MaterialPriority.MEDIUM;

  @Column(name = "due_at")
  private Instant dueAt;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private MaterialStatus status = MaterialStatus.PENDING;

  @Column(name = "assigned_to")
  private UUID assignedTo;

  @Column(name = "created_by")
  private UUID createdBy;
}
