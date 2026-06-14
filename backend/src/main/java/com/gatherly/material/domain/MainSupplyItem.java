package com.gatherly.material.domain;

import com.gatherly.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * Global, Admin-owned supply catalog item (docs/02 §3.5). Reusable across events; an event
 * {@code material} may reference one via {@code catalog_item_id}. Deleting a referenced item is
 * blocked (FK {@code ON DELETE RESTRICT}; the service surfaces a clean 409). Admin-only mutation —
 * Sub-admins can never delete a main supply item (docs/00 §5).
 */
@Entity
@Table(name = "main_supply_item")
public class MainSupplyItem extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Column
    private String unit;

    @Column(name = "default_quantity")
    private Integer defaultQuantity;

    @Column(nullable = false)
    private boolean active = true;

    public MainSupplyItem() {
        // JPA
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Integer getDefaultQuantity() {
        return defaultQuantity;
    }

    public void setDefaultQuantity(Integer defaultQuantity) {
        this.defaultQuantity = defaultQuantity;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
