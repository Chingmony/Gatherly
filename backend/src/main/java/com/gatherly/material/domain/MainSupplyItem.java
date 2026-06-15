package com.gatherly.material.domain;

import com.gatherly.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

    /** Human-facing stock-keeping unit, e.g. {@code FUR-0420}. Optional, unique when present. */
    @Column
    private String sku;

    @Enumerated(EnumType.STRING)
    @Column
    private SupplyCategory category;

    /** Current inventory count. Drives the derived {@link SupplyStatus} badge. */
    @Column(name = "on_hand", nullable = false)
    private int onHand = 0;

    /** Reorder point: at or below this on-hand count the item reads as low stock. Null disables it. */
    @Column(name = "low_stock_threshold")
    private Integer lowStockThreshold;

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

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public SupplyCategory getCategory() {
        return category;
    }

    public void setCategory(SupplyCategory category) {
        this.category = category;
    }

    public int getOnHand() {
        return onHand;
    }

    public void setOnHand(int onHand) {
        this.onHand = onHand;
    }

    public Integer getLowStockThreshold() {
        return lowStockThreshold;
    }

    public void setLowStockThreshold(Integer lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }

    /** Derived stock badge — never persisted (docs/03 §4.6). */
    public SupplyStatus getStatus() {
        return SupplyStatus.of(onHand, lowStockThreshold);
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
