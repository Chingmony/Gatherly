package com.gatherly.material.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Append-only audit row for a material status transition (docs/02 §3.7, docs/06 §5). Does not
 * extend {@link com.gatherly.common.domain.BaseEntity} because the table has no {@code updated_at}
 * column — history is immutable, so only an audited {@code created_at} applies. {@code fromStatus}
 * is null for the very first row of a material's life.
 */
@Entity
@Table(name = "material_status_history")
@EntityListeners(AuditingEntityListener.class)
public class MaterialStatusHistory {

    @Id
    @GeneratedValue
    @Column(updatable = false, nullable = false)
    private UUID id;

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

    @Column
    private String note;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    public MaterialStatusHistory() {
        // JPA
    }

    public MaterialStatusHistory(UUID materialId, MaterialStatus fromStatus, MaterialStatus toStatus,
                                 UUID changedBy, String note) {
        this.materialId = materialId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.changedBy = changedBy;
        this.note = note;
    }

    public UUID getId() {
        return id;
    }

    public UUID getMaterialId() {
        return materialId;
    }

    public MaterialStatus getFromStatus() {
        return fromStatus;
    }

    public MaterialStatus getToStatus() {
        return toStatus;
    }

    public UUID getChangedBy() {
        return changedBy;
    }

    public String getNote() {
        return note;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
