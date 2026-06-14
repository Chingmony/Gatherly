package com.gatherly.service;

import com.gatherly.dto.material.MaterialHistoryResponse;
import com.gatherly.dto.material.MaterialRequest;
import com.gatherly.dto.material.MaterialResponse;
import com.gatherly.dto.material.MaterialStatusChangeRequest;
import com.gatherly.security.UserPrincipal;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** Event materials + the workflow state machine ({@code docs/03} §4.7, {@code docs/06} §5). */
public interface MaterialService {

  Page<MaterialResponse> list(UUID eventId, String search, Pageable pageable);

  MaterialResponse create(UUID eventId, MaterialRequest request, UserPrincipal principal);

  MaterialResponse update(UUID eventId, UUID materialId, MaterialRequest request);

  /** Drive a transition with state-machine + role enforcement, writing an audit row. */
  MaterialResponse changeStatus(
      UUID materialId, MaterialStatusChangeRequest request, UserPrincipal principal);

  List<MaterialHistoryResponse> history(UUID materialId);

  void delete(UUID eventId, UUID materialId);
}
