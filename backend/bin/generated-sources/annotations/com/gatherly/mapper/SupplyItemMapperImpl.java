package com.gatherly.mapper;

import com.gatherly.domain.MainSupplyItem;
import com.gatherly.dto.supply.SupplyItemResponse;
import java.time.Instant;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-14T23:38:29+0700",
    comments = "version: 1.6.0, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class SupplyItemMapperImpl implements SupplyItemMapper {

    @Override
    public SupplyItemResponse toResponse(MainSupplyItem item) {
        if ( item == null ) {
            return null;
        }

        UUID id = null;
        String name = null;
        String description = null;
        String unit = null;
        Integer defaultQuantity = null;
        boolean active = false;
        Instant createdAt = null;
        Instant updatedAt = null;

        id = item.getId();
        name = item.getName();
        description = item.getDescription();
        unit = item.getUnit();
        defaultQuantity = item.getDefaultQuantity();
        active = item.isActive();
        createdAt = item.getCreatedAt();
        updatedAt = item.getUpdatedAt();

        SupplyItemResponse supplyItemResponse = new SupplyItemResponse( id, name, description, unit, defaultQuantity, active, createdAt, updatedAt );

        return supplyItemResponse;
    }
}
