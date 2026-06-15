package com.gatherly.material.domain;

/**
 * Category of a main supply catalog item (docs/02 §3.5). Mirrors the filter tabs on the Supply
 * Catalog UI; persisted as its name via {@code @Enumerated(STRING)} and CHECK-constrained in
 * {@code V11}. {@link #OTHER} is the catch-all for uncategorised stock.
 */
public enum SupplyCategory {
    FURNITURE,
    PRINT,
    AV,
    STAGING,
    CATERING,
    COMMS,
    OTHER
}
