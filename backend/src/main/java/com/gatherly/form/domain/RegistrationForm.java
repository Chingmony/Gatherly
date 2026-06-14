package com.gatherly.form.domain;

import com.gatherly.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

/**
 * Dynamic registration form (docs/02 §3.9) — 1:1 with an event ({@code UNIQUE(event_id)}). The
 * field definitions live entirely in the {@code schema} JSONB array (Zero-Migration Forms,
 * CLAUDE.md) — a {@code String} attribute mapped with {@link SqlTypes#JSON} stores/reads the raw
 * JSON verbatim. Editable while {@code DRAFT}; locked once {@code ACTIVE}.
 */
@Entity
@Table(name = "registration_form")
public class RegistrationForm extends BaseEntity {

    @Column(name = "event_id", nullable = false, unique = true)
    private UUID eventId;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FormStatus status = FormStatus.DRAFT;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String schema = "[]";

    @Column(nullable = false)
    private int version = 1;

    @Column(name = "created_by")
    private UUID createdBy;

    public RegistrationForm() {
        // JPA
    }

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public FormStatus getStatus() {
        return status;
    }

    public void setStatus(FormStatus status) {
        this.status = status;
    }

    public String getSchema() {
        return schema;
    }

    public void setSchema(String schema) {
        this.schema = schema;
    }

    public int getVersion() {
        return version;
    }

    public void setVersion(int version) {
        this.version = version;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }
}
