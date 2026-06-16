package com.gatherly.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.Event;
import com.gatherly.domain.EventStatus;
import com.gatherly.mapper.EventMapper;
import com.gatherly.repository.EventAssignmentRepository;
import com.gatherly.repository.EventRepository;
import com.gatherly.repository.FormTemplateRepository;
import com.gatherly.repository.RegistrationFormRepository;
import com.gatherly.repository.RegistrationSubmissionRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/** Unit tests (Mockito, no Spring/Docker) for the event lifecycle guards. */
@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

  @Mock private EventRepository eventRepository;
  @Mock private EventAssignmentRepository assignmentRepository;
  @Mock private RegistrationSubmissionRepository submissionRepository;
  @Mock private FormTemplateRepository formTemplateRepository;
  @Mock private RegistrationFormRepository formRepository;
  @Mock private EventMapper eventMapper;
  @Mock private StorageService storageService;

  private EventServiceImpl service;

  @BeforeEach
  void setUp() {
    service =
        new EventServiceImpl(
            eventRepository,
            assignmentRepository,
            submissionRepository,
            formTemplateRepository,
            formRepository,
            eventMapper,
            storageService);
    lenient().when(eventMapper.toResponse(any(), anyLong())).thenReturn(null);
  }

  private Event eventWith(EventStatus status) {
    Event e = new Event();
    e.setStatus(status);
    when(eventRepository.findById(any(UUID.class))).thenReturn(Optional.of(e));
    return e;
  }

  @Test
  void publishMovesDraftToPublic() {
    Event e = eventWith(EventStatus.DRAFT);
    service.publish(UUID.randomUUID());
    assertThat(e.getStatus()).isEqualTo(EventStatus.PUBLIC);
  }

  @Test
  void publishRejectsNonDraft() {
    eventWith(EventStatus.PUBLIC);
    assertThatThrownBy(() -> service.publish(UUID.randomUUID()))
        .isInstanceOf(ApiException.class)
        .extracting(ex -> ((ApiException) ex).getCode())
        .isEqualTo(ErrorCode.CONFLICT);
  }

  @Test
  void archiveMovesPublicToArchived() {
    Event e = eventWith(EventStatus.PUBLIC);
    service.archive(UUID.randomUUID());
    assertThat(e.getStatus()).isEqualTo(EventStatus.ARCHIVED);
  }

  @Test
  void archiveRejectsDraft() {
    eventWith(EventStatus.DRAFT);
    assertThatThrownBy(() -> service.archive(UUID.randomUUID()))
        .isInstanceOf(ApiException.class)
        .extracting(ex -> ((ApiException) ex).getCode())
        .isEqualTo(ErrorCode.CONFLICT);
  }
}
