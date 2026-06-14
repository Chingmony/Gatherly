package com.gatherly.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.Event;
import com.gatherly.domain.EventCheckin;
import com.gatherly.domain.GlobalRole;
import com.gatherly.domain.RegistrationSubmission;
import com.gatherly.domain.TicketStatus;
import com.gatherly.dto.attendance.ScanRequest;
import com.gatherly.repository.EventCheckinRepository;
import com.gatherly.repository.EventRepository;
import com.gatherly.repository.RegistrationSubmissionRepository;
import com.gatherly.security.UserPrincipal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Unit tests for the idempotent attendance scan ({@code docs/06} §4). */
@ExtendWith(MockitoExtension.class)
class AttendanceServiceImplTest {

  @Mock private RegistrationSubmissionRepository submissionRepository;
  @Mock private EventCheckinRepository checkinRepository;
  @Mock private EventRepository eventRepository;

  private AttendanceServiceImpl service;
  private final UUID eventId = UUID.randomUUID();
  private final UserPrincipal staff =
      new UserPrincipal(UUID.randomUUID(), "staff@example.com", GlobalRole.MEMBER);

  @BeforeEach
  void setUp() {
    service = new AttendanceServiceImpl(submissionRepository, checkinRepository, eventRepository);
    lenient().when(eventRepository.findById(any())).thenReturn(Optional.of(new Event()));
  }

  private RegistrationSubmission submission(TicketStatus status) {
    RegistrationSubmission s = new RegistrationSubmission();
    s.setEventId(eventId);
    s.setGuestPhone("+855 12 000 000");
    s.setQrStatus(status);
    return s;
  }

  @Test
  void firstScanConfirmsAttendance() {
    RegistrationSubmission s = submission(TicketStatus.DELIVERED);
    when(submissionRepository.findByCheckinToken(any())).thenReturn(Optional.of(s));
    when(checkinRepository.findBySubmissionId(any())).thenReturn(Optional.empty());

    service.scan(eventId, new ScanRequest("tok"), staff);

    assertThat(s.getQrStatus()).isEqualTo(TicketStatus.CHECKED_IN);
  }

  @Test
  void reScanReturnsAlreadyCheckedIn() {
    when(submissionRepository.findByCheckinToken(any()))
        .thenReturn(Optional.of(submission(TicketStatus.CHECKED_IN)));
    EventCheckin existing = new EventCheckin();
    existing.setCheckedInAt(Instant.now());
    when(checkinRepository.findBySubmissionId(any())).thenReturn(Optional.of(existing));

    assertThatThrownBy(() -> service.scan(eventId, new ScanRequest("tok"), staff))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getCode())
        .isEqualTo(ErrorCode.ALREADY_CHECKED_IN);
  }

  @Test
  void scanningRevokedTicketIsInvalid() {
    when(submissionRepository.findByCheckinToken(any()))
        .thenReturn(Optional.of(submission(TicketStatus.REVOKED)));

    assertThatThrownBy(() -> service.scan(eventId, new ScanRequest("tok"), staff))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getCode())
        .isEqualTo(ErrorCode.TICKET_INVALID);
  }

  @Test
  void tokenFromAnotherEventIsNotFound() {
    RegistrationSubmission other = submission(TicketStatus.DELIVERED);
    other.setEventId(UUID.randomUUID()); // different event
    when(submissionRepository.findByCheckinToken(any())).thenReturn(Optional.of(other));

    assertThatThrownBy(() -> service.scan(eventId, new ScanRequest("tok"), staff))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getCode())
        .isEqualTo(ErrorCode.NOT_FOUND);
  }

  @Test
  void revokingCheckedInTicketIsRejected() {
    when(submissionRepository.findById(any()))
        .thenReturn(Optional.of(submission(TicketStatus.CHECKED_IN)));

    assertThatThrownBy(() -> service.revoke(eventId, UUID.randomUUID()))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getCode())
        .isEqualTo(ErrorCode.CONFLICT);
  }
}
