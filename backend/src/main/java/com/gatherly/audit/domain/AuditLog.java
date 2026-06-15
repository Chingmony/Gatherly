package com.gatherly.audit.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * Append-only privileged-action audit record (docs/08 §5, docs/10 §audit): who did what, to which
 * target, when, correlated by {@code traceId}. Written by {@link com.gatherly.audit.AuditService};
 * never updated or deleted by the app. {@code actorEmail} is denormalized so the trail survives a
 * later user deletion (the FK is {@code ON DELETE SET NULL}).
 */
@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "actor_id")
    private UUID actorId;

    @Column(name = "actor_email")
    private String actorEmail;

    @Column(nullable = false)
    private String action;

    @Column(name = "target_type", nullable = false)
    private String targetType;

    @Column(name = "target_id")
    private UUID targetId;

    @Column
    private String detail;

    @Column(name = "trace_id")
    private String traceId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected AuditLog() {
    }

    public AuditLog(UUID actorId, String actorEmail, String action, String targetType,
                    UUID targetId, String detail, String traceId) {
        this.actorId = actorId;
        this.actorEmail = actorEmail;
        this.action = action;
        this.targetType = targetType;
        this.targetId = targetId;
        this.detail = detail;
        this.traceId = traceId;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getActorId() {
        return actorId;
    }

    public String getActorEmail() {
        return actorEmail;
    }

    public String getAction() {
        return action;
    }

    public String getTargetType() {
        return targetType;
    }

    public UUID getTargetId() {
        return targetId;
    }

    public String getDetail() {
        return detail;
    }

    public String getTraceId() {
        return traceId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
