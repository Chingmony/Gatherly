package com.gatherly.material;

import com.gatherly.material.domain.MainSupplyItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MainSupplyItemRepository extends JpaRepository<MainSupplyItem, UUID> {

    /** Admin-managed catalog, alphabetical (bounded; docs/03 §4.6 read). */
    List<MainSupplyItem> findAllByOrderByNameAsc();

    /** SKU uniqueness guard (case-insensitive) — backed by ux_main_supply_item_sku. */
    Optional<MainSupplyItem> findBySkuIgnoreCase(String sku);
}
