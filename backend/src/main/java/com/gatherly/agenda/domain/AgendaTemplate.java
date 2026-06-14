package com.gatherly.agenda.domain;

import com.gatherly.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Global agenda template (docs/02 §3.8) — built-in defaults ({@code is_default=true}, seeded in
 * {@code V2__seed.sql}) plus custom ones. {@code items} is the raw JSONB array
 * {@code [{title, durationMin, order}]}; mapping a {@code String} attribute with
 * {@link SqlTypes#JSON} stores/reads the JSON text verbatim (parsed for the API in the mapper).
 */
@Entity
@Table(name = "agenda_template")
public class AgendaTemplate extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String items = "[]";

    @Column(name = "is_default", nullable = false)
    private boolean isDefault;

    public AgendaTemplate() {
        // JPA
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getItems() {
        return items;
    }

    public void setItems(String items) {
        this.items = items;
    }

    public boolean isDefault() {
        return isDefault;
    }

    public void setDefault(boolean aDefault) {
        isDefault = aDefault;
    }
}
