package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.common.PageMeta;
import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.paging.PageRequests;
import com.gatherly.domain.AssetPurpose;
import com.gatherly.dto.user.ChangePasswordRequest;
import com.gatherly.dto.user.SelfUpdateRequest;
import com.gatherly.dto.user.UserCreateRequest;
import com.gatherly.dto.user.UserResponse;
import com.gatherly.dto.user.UserSort;
import com.gatherly.dto.user.UserUpdateRequest;
import com.gatherly.security.UserPrincipal;
import com.gatherly.service.StorageService;
import com.gatherly.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * User management ({@code docs/03} §4.2). Thin: each method delegates to one {@link UserService}
 * call whose {@code @PreAuthorize} gate is the real authority. The {@code /me} routes are
 * self-scoped; {@code /users} routes are Admin-only.
 */
@Tag(
    name = "Users",
    description =
        "Admin-only user CRUD under /users, plus self-service profile endpoints under /me."
            + " Sub-admins (MANAGER) cannot reach the /users routes at all.")
@RestController
public class UserController {

  private final UserService userService;
  private final StorageService storageService;

  public UserController(UserService userService, StorageService storageService) {
    this.userService = userService;
    this.storageService = storageService;
  }

  // ── Admin CRUD ──────────────────────────────────────────────────────────────

  @Operation(
      summary = "List users (Admin)",
      description =
          "Paginated, searchable directory of all users. ADMIN only. Query params: `search`"
              + " (case-insensitive match on full name or email), `page` (0-based, default 0),"
              + " `size` (default 20, max 100), `sort` = NAME | EMAIL | STATUS | CREATED_AT (default"
              + " NAME), `direction` = ASC | DESC (default ASC). Returns the paged envelope with"
              + " page metadata.")
  @GetMapping("/users")
  public ApiResponse<List<UserResponse>> list(
      @RequestParam(required = false) String search,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "NAME") UserSort sort,
      @RequestParam(defaultValue = "ASC") Sort.Direction direction) {
    Pageable pageable = PageRequests.of(page, size, sort, direction);
    Page<UserResponse> result = userService.search(search, pageable);
    return ApiResponse.page(
        "Users retrieved successfully.", result.getContent(), PageMeta.from(result));
  }

  @Operation(
      summary = "Create a user (Admin)",
      description =
          "Creates a user with the given global role (ADMIN, SUB_ADMIN, or USER) and an initial"
              + " password. The role is required."
              + " ADMIN only. Errors: 409 CONFLICT if the email already exists; 400 VALIDATION_ERROR"
              + " for invalid fields.")
  @PostMapping("/users")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<UserResponse> create(@Valid @RequestBody UserCreateRequest request) {
    return ApiResponse.ok("User created successfully.", userService.create(request));
  }

  @Operation(
      summary = "Get a user by id (Admin)",
      description = "Fetches a single user record. ADMIN only. Errors: 404 NOT_FOUND if unknown.")
  @GetMapping("/users/{userId}")
  public ApiResponse<UserResponse> get(@PathVariable UUID userId) {
    return ApiResponse.ok("User retrieved successfully.", userService.get(userId));
  }

  @Operation(
      summary = "Update a user (Admin)",
      description =
          "Partial update of a user including global role and status. ADMIN only; null fields are"
              + " left unchanged. Errors: 404 NOT_FOUND if unknown.")
  @PutMapping("/users/{userId}")
  public ApiResponse<UserResponse> update(
      @PathVariable UUID userId, @Valid @RequestBody UserUpdateRequest request) {
    return ApiResponse.ok("User updated successfully.", userService.update(userId, request));
  }

  @Operation(
      summary = "Delete a user (Admin)",
      description =
          "Permanently deletes a user. ADMIN only (Sub-admins are forbidden). You cannot delete"
              + " your own account (409 CONFLICT). Errors: 404 NOT_FOUND if unknown.")
  @DeleteMapping("/users/{userId}")
  public ApiResponse<Void> delete(
      @PathVariable UUID userId, @AuthenticationPrincipal UserPrincipal principal) {
    userService.delete(userId, principal.id());
    return ApiResponse.ok("User deleted successfully.");
  }

  // ── Self-profile ────────────────────────────────────────────────────────────

  @Operation(
      summary = "Get my profile",
      description = "Returns the authenticated caller's own user record. Any authenticated user.")
  @GetMapping("/me")
  public ApiResponse<UserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.ok("Profile retrieved successfully.", userService.getSelf(principal.id()));
  }

  @Operation(
      summary = "Update my profile",
      description =
          "Updates the caller's own editable profile fields (name, phone, gender, date of birth,"
              + " address). Role and status are NOT self-editable. Any authenticated user.")
  @PutMapping("/me")
  public ApiResponse<UserResponse> updateMe(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody SelfUpdateRequest request) {
    return ApiResponse.ok(
        "Profile updated successfully.", userService.updateSelf(principal.id(), request));
  }

  @Operation(
      summary = "Change my password",
      description =
          "Changes the caller's password after verifying the current one. Any authenticated user."
              + " Errors: 400 VALIDATION_ERROR if the current password is incorrect or the new one"
              + " fails the length rule.")
  @PutMapping("/me/password")
  public ApiResponse<Void> changePassword(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody ChangePasswordRequest request) {
    userService.changePassword(principal.id(), request);
    return ApiResponse.ok("Password changed successfully.");
  }

  @Operation(
      summary = "Upload my profile photo",
      description =
          "Uploads an avatar image (PNG/JPEG/WebP, max 5 MB) for the caller. The API brokers the"
              + " bytes to object storage and persists the key; the updated profile (with a viewable"
              + " avatarUrl) is returned. Any authenticated user. Errors: 400 VALIDATION_ERROR for"
              + " an empty file or unsupported type/size.")
  @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiResponse<UserResponse> uploadAvatar(
      @AuthenticationPrincipal UserPrincipal principal,
      @RequestParam("file") MultipartFile file) {
    if (file.isEmpty()) {
      throw new ApiException(ErrorCode.VALIDATION_ERROR, "No file provided.");
    }
    byte[] bytes;
    try {
      bytes = file.getBytes();
    } catch (IOException e) {
      throw new ApiException(ErrorCode.VALIDATION_ERROR, "Could not read the uploaded file.");
    }
    String key = storageService.store(AssetPurpose.USER_AVATAR, bytes, file.getContentType());
    return ApiResponse.ok(
        "Avatar updated successfully.", userService.updateAvatar(principal.id(), key));
  }
}
