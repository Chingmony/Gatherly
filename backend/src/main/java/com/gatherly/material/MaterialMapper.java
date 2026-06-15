package com.gatherly.material;

import com.gatherly.material.domain.Material;
import com.gatherly.material.domain.MainSupplyItem;
import com.gatherly.material.domain.MaterialStatusHistory;
import com.gatherly.material.dto.MaterialHistoryResponse;
import com.gatherly.material.dto.MaterialResponse;
import com.gatherly.material.dto.MyTaskResponse;
import com.gatherly.material.dto.SupplyItemResponse;

/** Hand-written mapping (docs/06 §1) for the material domain. Display names are resolved by the caller. */
public final class MaterialMapper {

    private MaterialMapper() {
    }

    public static SupplyItemResponse toResponse(MainSupplyItem i) {
        return new SupplyItemResponse(i.getId(), i.getName(), i.getDescription(), i.getSku(),
                i.getCategory(), i.getUnit(), i.getOnHand(), i.getLowStockThreshold(), i.getStatus(),
                i.getDefaultQuantity(), i.isActive(), i.getCreatedAt(), i.getUpdatedAt());
    }

    public static MaterialResponse toResponse(Material m, String assignedToName) {
        return new MaterialResponse(m.getId(), m.getEventId(), m.getCatalogItemId(), m.getName(),
                m.getDescription(), m.getQuantity(), m.getStatus(), m.getAssignedTo(), assignedToName,
                m.getCreatedBy(), m.getCreatedAt(), m.getUpdatedAt());
    }

    public static MyTaskResponse toTask(Material m, String eventTitle) {
        return new MyTaskResponse(m.getId(), m.getEventId(), eventTitle, m.getName(), m.getDescription(),
                m.getQuantity(), m.getStatus(), m.getCreatedAt(), m.getUpdatedAt());
    }

    public static MaterialHistoryResponse toResponse(MaterialStatusHistory h, String changedByName) {
        return new MaterialHistoryResponse(h.getId(), h.getMaterialId(), h.getFromStatus(), h.getToStatus(),
                h.getChangedBy(), changedByName, h.getNote(), h.getCreatedAt());
    }
}
