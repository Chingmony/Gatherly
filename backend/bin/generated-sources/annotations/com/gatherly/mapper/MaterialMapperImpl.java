package com.gatherly.mapper;

import com.gatherly.domain.Material;
import com.gatherly.domain.MaterialPriority;
import com.gatherly.domain.MaterialStatus;
import com.gatherly.domain.MaterialStatusHistory;
import com.gatherly.dto.material.MaterialHistoryResponse;
import com.gatherly.dto.material.MaterialResponse;
import java.time.Instant;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-15T11:47:35+0700",
    comments = "version: 1.6.0, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class MaterialMapperImpl implements MaterialMapper {

    @Override
    public MaterialResponse toResponse(Material material) {
        if ( material == null ) {
            return null;
        }

        UUID id = null;
        UUID eventId = null;
        UUID catalogItemId = null;
        String name = null;
        String description = null;
        Integer quantity = null;
        String category = null;
        MaterialPriority priority = null;
        Instant dueAt = null;
        MaterialStatus status = null;
        UUID assignedTo = null;
        UUID createdBy = null;
        Instant createdAt = null;
        Instant updatedAt = null;

        id = material.getId();
        eventId = material.getEventId();
        catalogItemId = material.getCatalogItemId();
        name = material.getName();
        description = material.getDescription();
        quantity = material.getQuantity();
        category = material.getCategory();
        priority = material.getPriority();
        dueAt = material.getDueAt();
        status = material.getStatus();
        assignedTo = material.getAssignedTo();
        createdBy = material.getCreatedBy();
        createdAt = material.getCreatedAt();
        updatedAt = material.getUpdatedAt();

        MaterialResponse materialResponse = new MaterialResponse( id, eventId, catalogItemId, name, description, quantity, category, priority, dueAt, status, assignedTo, createdBy, createdAt, updatedAt );

        return materialResponse;
    }

    @Override
    public MaterialHistoryResponse toHistoryResponse(MaterialStatusHistory history) {
        if ( history == null ) {
            return null;
        }

        UUID id = null;
        MaterialStatus fromStatus = null;
        MaterialStatus toStatus = null;
        UUID changedBy = null;
        String note = null;
        Instant createdAt = null;

        id = history.getId();
        fromStatus = history.getFromStatus();
        toStatus = history.getToStatus();
        changedBy = history.getChangedBy();
        note = history.getNote();
        createdAt = history.getCreatedAt();

        MaterialHistoryResponse materialHistoryResponse = new MaterialHistoryResponse( id, fromStatus, toStatus, changedBy, note, createdAt );

        return materialHistoryResponse;
    }
}
