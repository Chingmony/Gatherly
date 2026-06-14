package com.gatherly.service;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.User;
import com.gatherly.domain.UserStatus;
import com.gatherly.dto.user.ChangePasswordRequest;
import com.gatherly.dto.user.SelfUpdateRequest;
import com.gatherly.dto.user.UserCreateRequest;
import com.gatherly.dto.user.UserResponse;
import com.gatherly.dto.user.UserUpdateRequest;
import com.gatherly.integration.email.EmailService;
import com.gatherly.mapper.UserMapper;
import com.gatherly.repository.UserRepository;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link UserService} implementation. {@code @PreAuthorize} gates map directly to the {@code
 * docs/00} §5 matrix: global CRUD is Admin-only; {@code /me} operations are self-scoped. Sub-admins
 * cannot reach these CRUD methods at all (no MANAGER path exists here) — satisfying the hard
 * product rule.
 */
@Service
public class UserServiceImpl implements UserService {

  /** Welcome-email setup link validity — long enough for a new member to act on it. */
  private static final Duration SETUP_TOKEN_TTL = Duration.ofHours(48);

  private final UserRepository userRepository;
  private final UserMapper userMapper;
  private final PasswordEncoder passwordEncoder;
  private final EmailService emailService;
  private final OtpService otpService;
  private final String publicBaseUrl;

  public UserServiceImpl(
      UserRepository userRepository,
      UserMapper userMapper,
      PasswordEncoder passwordEncoder,
      EmailService emailService,
      OtpService otpService,
      @Value("${app.public-base-url}") String publicBaseUrl) {
    this.userRepository = userRepository;
    this.userMapper = userMapper;
    this.passwordEncoder = passwordEncoder;
    this.emailService = emailService;
    this.otpService = otpService;
    this.publicBaseUrl = publicBaseUrl;
  }

  @Override
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional(readOnly = true)
  public Page<UserResponse> search(String query, Pageable pageable) {
    String q = (query == null || query.isBlank()) ? null : query.trim();
    return userRepository.search(q, pageable).map(userMapper::toResponse);
  }

  @Override
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public UserResponse create(UserCreateRequest request) {
    if (userRepository.existsByEmailIgnoreCase(request.email())) {
      throw new ApiException(ErrorCode.CONFLICT, "A user with this email already exists.");
    }
    User user = new User();
    user.setEmail(request.email().toLowerCase());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setFullName(request.fullName());
    user.setPhone(request.phone());
    user.setGlobalRole(request.globalRole());
    user.setStatus(UserStatus.ACTIVE);
    User persisted = userRepository.save(user);
    UserResponse saved = userMapper.toResponse(persisted);
    // Issue a single-use setup grant and email a one-click "set your password" link.
    // @Async + best-effort: a mail failure never blocks user creation.
    String grant = otpService.issueGrant(persisted.getId(), SETUP_TOKEN_TTL);
    emailService.sendWelcome(
        persisted.getEmail(), persisted.getFullName(), buildSetupUrl(persisted.getEmail(), grant));
    return saved;
  }

  /**
   * One-click set-password link: carries the member's email and the single-use grant token. The
   * frontend page redeems them against the standard reset-password endpoint — no OTP step needed.
   */
  private String buildSetupUrl(String email, String grant) {
    String base = publicBaseUrl.replaceAll("/+$", "");
    return base
        + "/set-password?email="
        + URLEncoder.encode(email, StandardCharsets.UTF_8)
        + "&token="
        + URLEncoder.encode(grant, StandardCharsets.UTF_8);
  }

  @Override
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional(readOnly = true)
  public UserResponse get(UUID userId) {
    return userMapper.toResponse(loadUser(userId));
  }

  @Override
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public UserResponse update(UUID userId, UserUpdateRequest request) {
    User user = loadUser(userId);
    if (request.fullName() != null) {
      user.setFullName(request.fullName());
    }
    if (request.phone() != null) {
      user.setPhone(request.phone());
    }
    if (request.gender() != null) {
      user.setGender(request.gender());
    }
    if (request.dateOfBirth() != null) {
      user.setDateOfBirth(request.dateOfBirth());
    }
    if (request.address() != null) {
      user.setAddress(request.address());
    }
    if (request.globalRole() != null) {
      user.setGlobalRole(request.globalRole());
    }
    if (request.status() != null) {
      user.setStatus(request.status());
    }
    return userMapper.toResponse(user);
  }

  @Override
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public void delete(UUID userId, UUID actingUserId) {
    User user = loadUser(userId);
    if (user.getId().equals(actingUserId)) {
      throw new ApiException(ErrorCode.CONFLICT, "You cannot delete your own account.");
    }
    userRepository.delete(user);
  }

  @Override
  @PreAuthorize("#userId == authentication.principal.id")
  @Transactional(readOnly = true)
  public UserResponse getSelf(UUID userId) {
    return userMapper.toResponse(loadUser(userId));
  }

  @Override
  @PreAuthorize("#userId == authentication.principal.id")
  @Transactional
  public UserResponse updateSelf(UUID userId, SelfUpdateRequest request) {
    User user = loadUser(userId);
    if (request.fullName() != null) {
      user.setFullName(request.fullName());
    }
    if (request.phone() != null) {
      user.setPhone(request.phone());
    }
    if (request.gender() != null) {
      user.setGender(request.gender());
    }
    if (request.dateOfBirth() != null) {
      user.setDateOfBirth(request.dateOfBirth());
    }
    if (request.address() != null) {
      user.setAddress(request.address());
    }
    return userMapper.toResponse(user);
  }

  @Override
  @PreAuthorize("#userId == authentication.principal.id")
  @Transactional
  public void changePassword(UUID userId, ChangePasswordRequest request) {
    User user = loadUser(userId);
    if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
      throw new ApiException(ErrorCode.VALIDATION_ERROR, "Current password is incorrect.");
    }
    user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
  }

  private User loadUser(UUID userId) {
    return userRepository
        .findById(userId)
        .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "User not found."));
  }
}
