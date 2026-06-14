package com.gatherly.service;

import com.gatherly.dto.supply.SupplyItemRequest;
import com.gatherly.dto.supply.SupplyItemResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** Main supply catalog ({@code docs/03} §4.6). Read = any authenticated; write/delete = Admin. */
public interface SupplyItemService {

  Page<SupplyItemResponse> search(String query, Pageable pageable);

  SupplyItemResponse create(SupplyItemRequest request);

  SupplyItemResponse update(UUID itemId, SupplyItemRequest request);

  void delete(UUID itemId);
}
