package com.gatherly.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.Event;
import com.gatherly.domain.EventStatus;
import com.gatherly.domain.FormFieldType;
import com.gatherly.domain.FormStatus;
import com.gatherly.domain.RegistrationForm;
import com.gatherly.domain.RegistrationSubmission;
import com.gatherly.dto.form.FormField;
import com.gatherly.dto.registration.RegistrationRequest;
import com.gatherly.dto.registration.RegistrationResponse;
import com.gatherly.integration.qr.QrService;
import com.gatherly.repository.EventRepository;
import com.gatherly.repository.RegistrationFormRepository;
import com.gatherly.repository.RegistrationSubmissionRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import tools.jackson.databind.json.JsonMapper;

/** Unit tests for the registration worked example (event/form gating + happy path). */
@ExtendWith(MockitoExtension.class)
class RegistrationServiceImplTest {

  @Mock private EventRepository eventRepository;
  @Mock private RegistrationFormRepository formRepository;
  @Mock private RegistrationSubmissionRepository submissionRepository;
  @Mock private QrTicketDispatcher dispatcher;
  @Mock private QrService qrService;

  private final FormSchemaCodec codec = new FormSchemaCodec(new JsonMapper());
  private RegistrationServiceImpl service;

  @BeforeEach
  void setUp() {
    service =
        new RegistrationServiceImpl(
            eventRepository,
            formRepository,
            submissionRepository,
            codec,
            new AnswerValidator(),
            dispatcher,
            qrService,
            new JsonMapper());
  }

  private Event event(EventStatus status) {
    Event e = new Event();
    ReflectionTestUtils.setField(e, "id", UUID.randomUUID());
    e.setStatus(status);
    e.setTitle("Launch");
    e.setSlug("launch");
    return e;
  }

  private RegistrationForm activeForm() {
    RegistrationForm f = new RegistrationForm();
    ReflectionTestUtils.setField(f, "id", UUID.randomUUID());
    f.setStatus(FormStatus.ACTIVE);
    f.setVersion(1);
    f.setSchema(
        codec.write(
            List.of(
                new FormField("email", "Email", FormFieldType.EMAIL, true, 1, null, null),
                new FormField("phone", "Phone", FormFieldType.PHONE, true, 2, null, null))));
    return f;
  }

  private RegistrationRequest validAnswers() {
    return new RegistrationRequest(Map.of("email", "dara@example.com", "phone", "+855 12 345 678"));
  }

  @Test
  void registerRejectsNonPublicEvent() {
    when(eventRepository.findById(any())).thenReturn(Optional.of(event(EventStatus.DRAFT)));
    assertThatThrownBy(() -> service.register(UUID.randomUUID(), validAnswers()))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getCode())
        .isEqualTo(ErrorCode.NOT_FOUND);
  }

  @Test
  void registerRequiresAnActiveForm() {
    when(eventRepository.findById(any())).thenReturn(Optional.of(event(EventStatus.PUBLIC)));
    when(formRepository.findByEventId(any())).thenReturn(Optional.empty());
    assertThatThrownBy(() -> service.register(UUID.randomUUID(), validAnswers()))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getCode())
        .isEqualTo(ErrorCode.NO_ACTIVE_FORM);
  }

  @Test
  void registerCreatesPendingTicketAndSchedulesDispatch() {
    when(eventRepository.findById(any())).thenReturn(Optional.of(event(EventStatus.PUBLIC)));
    when(formRepository.findByEventId(any())).thenReturn(Optional.of(activeForm()));
    when(submissionRepository.findByEventIdAndGuestEmailIgnoreCase(any(), any()))
        .thenReturn(Optional.empty());
    when(submissionRepository.save(any(RegistrationSubmission.class)))
        .thenAnswer(i -> i.getArgument(0));
    lenient().when(dispatcher.ticketUrl(any())).thenReturn("http://localhost:3000/tickets/x");

    TransactionSynchronizationManager.initSynchronization();
    try {
      RegistrationResponse response = service.register(UUID.randomUUID(), validAnswers());
      assertThat(response.ticketStatus().name()).isEqualTo("PENDING");
      verify(submissionRepository).save(any(RegistrationSubmission.class));
      assertThat(TransactionSynchronizationManager.getSynchronizations()).hasSize(1);
    } finally {
      TransactionSynchronizationManager.clearSynchronization();
    }
  }
}
