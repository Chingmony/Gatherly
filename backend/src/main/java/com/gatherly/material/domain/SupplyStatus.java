package com.gatherly.material.domain;

/**
 * Derived stock status of a main supply catalog item (docs/03 §4.6). Never persisted — computed
 * from {@code on_hand} and {@code low_stock_threshold} so the badge can never drift from the count.
 */
public enum SupplyStatus {
    IN_STOCK,
    LOW_STOCK,
    OUT_OF_STOCK;

    /**
     * Resolve the badge state. Zero (or unknown) on-hand is out of stock; at-or-below the reorder
     * threshold is low; otherwise in stock. A null threshold disables the low-stock band.
     */
    public static SupplyStatus of(int onHand, Integer lowStockThreshold) {
        if (onHand <= 0) {
            return OUT_OF_STOCK;
        }
        if (lowStockThreshold != null && onHand <= lowStockThreshold) {
            return LOW_STOCK;
        }
        return IN_STOCK;
    }
}
