package com.gatherly.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.gatherly.domain.EventRole;
import com.gatherly.domain.GlobalRole;
import com.gatherly.repository.EventAssignmentRepository;
import com.gatherly.repository.MaterialRepository;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

/** Unit tests (Mockito) for the two-layer event-scoped authorization gates. */
@ExtendWith(MockitoExtension.class)
class EventSecurityServiceTest {

  @Mock private EventAssignmentRepository assignmentRepository;
  @Mock private MaterialRepository materialRepository;
  @InjectMocks private EventSecurityService eventSecurity;

  private final UUID eventId = UUID.randomUUID();

  private Authentication auth(GlobalRole role) {
    UserPrincipal principal = new UserPrincipal(UUID.randomUUID(), "u@example.com", role);
    return UsernamePasswordAuthenticationToken.authenticated(
        principal, null, principal.authorities());
  }

  @Test
  void adminCanManageAndViewAnyEvent() {
    Authentication admin = auth(GlobalRole.ADMIN);
    // No repo interaction expected — admin short-circuits.
    assertThat(eventSecurity.canManage(eventId, admin)).isTrue();
    assertThat(eventSecurity.canView(eventId, admin)).isTrue();
  }

  @Test
  void managerCanManageTheirEvent() {
    Authentication member = auth(GlobalRole.USER);
    UUID userId = ((UserPrincipal) member.getPrincipal()).id();
    when(assignmentRepository.existsByEventIdAndUserIdAndEventRole(
            eventId, userId, EventRole.MANAGER))
        .thenReturn(true);

    assertThat(eventSecurity.canManage(eventId, member)).isTrue();
  }

  @Test
  void handlerCanViewButNotManage() {
    Authentication member = auth(GlobalRole.USER);
    UUID userId = ((UserPrincipal) member.getPrincipal()).id();
    when(assignmentRepository.existsByEventIdAndUserId(eventId, userId)).thenReturn(true);
    when(assignmentRepository.existsByEventIdAndUserIdAndEventRole(
            eventId, userId, EventRole.MANAGER))
        .thenReturn(false);

    assertThat(eventSecurity.canView(eventId, member)).isTrue();
    assertThat(eventSecurity.canManage(eventId, member)).isFalse();
  }

  @Test
  void unassignedMemberIsDeniedBothGates() {
    Authentication member = auth(GlobalRole.USER);
    assertThat(eventSecurity.canView(eventId, member)).isFalse();
    assertThat(eventSecurity.canManage(eventId, member)).isFalse();
  }

  @Test
  void nullAuthenticationIsDenied() {
    assertThat(eventSecurity.canView(eventId, null)).isFalse();
    assertThat(eventSecurity.canManage(eventId, null)).isFalse();
  }
}
