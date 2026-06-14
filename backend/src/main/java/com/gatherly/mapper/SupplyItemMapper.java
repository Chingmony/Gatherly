package com.gatherly.mapper;

import com.gatherly.domain.MainSupplyItem;
import com.gatherly.dto.supply.SupplyItemResponse;
import org.mapstruct.Mapper;

/** Entity → DTO mapping for supply catalog items. */
@Mapper(componentModel = "spring")
public interface SupplyItemMapper {

  SupplyItemResponse toResponse(MainSupplyItem item);
}
