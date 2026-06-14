package com.gatherly.mapper;

import com.gatherly.domain.Material;
import com.gatherly.domain.MaterialStatusHistory;
import com.gatherly.dto.material.MaterialHistoryResponse;
import com.gatherly.dto.material.MaterialResponse;
import org.mapstruct.Mapper;

/** Entity → DTO mapping for materials and their history. */
@Mapper(componentModel = "spring")
public interface MaterialMapper {

  MaterialResponse toResponse(Material material);

  MaterialHistoryResponse toHistoryResponse(MaterialStatusHistory history);
}
