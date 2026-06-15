package com.gatherly.material;

import com.gatherly.common.error.DomainConflictException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.error.NotFoundException;
import com.gatherly.material.domain.MainSupplyItem;
import com.gatherly.material.dto.SupplyItemRequest;
import com.gatherly.material.dto.SupplyItemResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Main supply catalog (docs/06 §5, docs/03 §4.6). Reads are open to any authenticated user; all
 * mutation is hard {@code hasRole('ADMIN')} — a Sub-admin can never delete a main supply item
 * (docs/00 §5, absolute restriction). Gates live here on the service layer (docs/06 §1).
 */
@Service
@Transactional
public class MainSupplyItemService {

    private final MainSupplyItemRepository items;
    private final MaterialRepository materials;

    public MainSupplyItemService(MainSupplyItemRepository items, MaterialRepository materials) {
        this.items = items;
        this.materials = materials;
    }

    @Transactional(readOnly = true)
    public List<SupplyItemResponse> list() {
        return items.findAllByOrderByNameAsc().stream().map(MaterialMapper::toResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public SupplyItemResponse create(SupplyItemRequest req) {
        MainSupplyItem item = new MainSupplyItem();
        apply(item, req);
        requireUniqueSku(item, null);
        return MaterialMapper.toResponse(saveCatchingSku(item));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public SupplyItemResponse update(UUID id, SupplyItemRequest req) {
        MainSupplyItem item = findOrThrow(id);
        apply(item, req);
        requireUniqueSku(item, id);
        return MaterialMapper.toResponse(saveCatchingSku(item));
    }

    /** Hard-delete (Admin only). Blocked with a clean 409 when any event material still references it. */
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(UUID id) {
        MainSupplyItem item = findOrThrow(id);
        if (materials.existsByCatalogItemId(id)) {
            throw new DomainConflictException(ErrorCode.CONFLICT,
                    "This supply item is referenced by one or more event materials and cannot be deleted.");
        }
        items.delete(item);
    }

    private static void apply(MainSupplyItem item, SupplyItemRequest req) {
        item.setName(req.name());
        item.setDescription(req.description());
        item.setSku(blankToNull(req.sku()));
        item.setCategory(req.category());
        item.setUnit(req.unit());
        item.setOnHand(req.onHand() == null ? 0 : req.onHand());
        item.setLowStockThreshold(req.lowStockThreshold());
        item.setDefaultQuantity(req.defaultQuantity());
        item.setActive(req.active() == null || req.active());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    /**
     * Persist, translating the unique-SKU index violation into a clean 409. The pre-check in
     * {@link #requireUniqueSku} handles the common case; this catches the concurrent door-rush race
     * where two admins commit the same SKU at once (the DB index is the only atomic guard).
     */
    private MainSupplyItem saveCatchingSku(MainSupplyItem item) {
        try {
            return items.saveAndFlush(item);
        } catch (DataIntegrityViolationException ex) {
            if (String.valueOf(ex.getMostSpecificCause().getMessage()).contains("ux_main_supply_item_sku")) {
                throw new DomainConflictException(ErrorCode.CONFLICT,
                        "Another supply item already uses SKU \"" + item.getSku() + "\".");
            }
            throw ex;
        }
    }

    /** Surface a clean 409 for a duplicate SKU rather than letting the unique index throw a 500. */
    private void requireUniqueSku(MainSupplyItem item, UUID selfId) {
        if (item.getSku() == null) {
            return;
        }
        items.findBySkuIgnoreCase(item.getSku())
                .filter(other -> !other.getId().equals(selfId))
                .ifPresent(other -> {
                    throw new DomainConflictException(ErrorCode.CONFLICT,
                            "Another supply item already uses SKU \"" + item.getSku() + "\".");
                });
    }

    private MainSupplyItem findOrThrow(UUID id) {
        return items.findById(id).orElseThrow(() -> new NotFoundException("Supply item not found."));
    }
}
