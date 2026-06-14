package com.gatherly.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.GlobalRole;
import com.gatherly.domain.Material;
import com.gatherly.domain.MaterialStatus;
import com.gatherly.dto.material.MaterialStatusChangeRequest;
import com.gatherly.mapper.MaterialMapper;
import com.gatherly.repository.EventRepository;
import com.gatherly.repository.MainSupplyItemRepository;
import com.gatherly.repository.MaterialRepository;
import com.gatherly.repository.MaterialStatusHistoryRepository;
import com.gatherly.repository.UserRepository;
import com.gatherly.security.EventSecurityService;
import com.gatherly.security.UserPrincipal;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Unit tests (Mockito) for the material state machine + handler/manager enforcement. */
@ExtendWith(MockitoExtension.class)
class MaterialServiceImplTest {

  @Mock private MaterialRepository materialRepository;
  @Mock private MaterialStatusHistoryRepository historyRepository;
  @Mock private EventRepository eventRepository;
  @Mock private UserRepository userRepository;
  @Mock private MainSupplyItemRepository supplyItemRepository;
  @Mock private EventSecurityService eventSecurity;
  @Mock private MaterialMapper mapper;

  private MaterialServiceImpl service;
  private final UserPrincipal principal =
      new UserPrincipal(UUID.randomUUID(), "u@example.com", GlobalRole.MEMBER);

  @BeforeEach
  void setUp() {
    service =
        new MaterialServiceImpl(
            materialRepository,
            historyRepository,
            eventRepository,
            userRepository,
            supplyItemRepository,
            eventSecurity,
            mapper);
    lenient().when(mapper.toResponse(any())).thenReturn(null);
  }

  private Material material(MaterialStatus status) {
    Material m = new Material();
    m.setEventId(UUID.randomUUID());
    m.setStatus(status);
    when(materialRepository.findById(any(UUID.class))).thenReturn(Optional.of(m));
    return m;
  }

  private MaterialStatusChangeRequest to(MaterialStatus s) {
    return new MaterialStatusChangeRequest(s, null);
  }

  @Test
  void handlerCanAdvanceOwnMaterial() {
    Material m = material(MaterialStatus.PENDING);
    service.changeStatus(UUID.randomUUID(), to(MaterialStatus.IN_PROGRESS), principal);
    assertThat(m.getStatus()).isEqualTo(MaterialStatus.IN_PROGRESS);
  }

  @Test
  void illegalTransitionIsRejected() {
    material(MaterialStatus.PENDING);
    assertThatThrownBy(
            () -> service.changeStatus(UUID.randomUUID(), to(MaterialStatus.DONE), principal))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getCode())
        .isEqualTo(ErrorCode.CONFLICT);
  }

  @Test
  void approvalByNonManagerIsForbidden() {
    material(MaterialStatus.NEEDS_REVIEW);
    when(eventSecurity.canManage(any(), any())).thenReturn(false);
    assertThatThrownBy(
            () -> service.changeStatus(UUID.randomUUID(), to(MaterialStatus.DONE), principal))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getCode())
        .isEqualTo(ErrorCode.FORBIDDEN);
  }

  @Test
  void approvalByManagerSucceeds() {
    Material m = material(MaterialStatus.NEEDS_REVIEW);
    when(eventSecurity.canManage(any(), any())).thenReturn(true);
    service.changeStatus(UUID.randomUUID(), to(MaterialStatus.DONE), principal);
    assertThat(m.getStatus()).isEqualTo(MaterialStatus.DONE);
  }
}
