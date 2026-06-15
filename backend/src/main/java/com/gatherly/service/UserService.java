package com.gatherly.service;

import com.gatherly.dto.user.ChangePasswordRequest;
import com.gatherly.dto.user.SelfUpdateRequest;
import com.gatherly.dto.user.UserCreateRequest;
import com.gatherly.dto.user.UserResponse;
import com.gatherly.dto.user.UserUpdateRequest;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Global user CRUD (Admin) + self-profile ({@code docs/03} §4.2). Authorization is enforced by
 * {@code @PreAuthorize} on the implementation methods — the real authority per {@code docs/00} §5.
 */
public interface UserService {

  Page<UserResponse> search(String query, Pageable pageable);

  UserResponse create(UserCreateRequest request);

  UserResponse get(UUID userId);

  UserResponse update(UUID userId, UserUpdateRequest request);

  void delete(UUID userId, UUID actingUserId);

  UserResponse getSelf(UUID userId);

  UserResponse updateSelf(UUID userId, SelfUpdateRequest request);

  UserResponse updateAvatar(UUID userId, String avatarKey);

  void changePassword(UUID userId, ChangePasswordRequest request);
}
