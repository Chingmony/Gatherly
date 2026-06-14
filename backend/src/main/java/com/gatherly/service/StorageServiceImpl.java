package com.gatherly.service;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.AssetPurpose;
import com.gatherly.dto.storage.PresignRequest;
import com.gatherly.dto.storage.PresignResponse;
import com.gatherly.integration.rustfs.RustfsClient;
import com.gatherly.security.UserPrincipal;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Issues presigned upload URLs after validating content-type/size and generating a purpose-scoped
 * object key ({@code docs/04} §4.4). The {@code @PreAuthorize} gate is the authority: org assets
 * require Admin (matrix row "edit org profile"); avatars are self-scoped.
 */
@Service
public class StorageServiceImpl implements StorageService {

  private static final long MAX_BYTES = 5L * 1024 * 1024; // 5 MB
  private static final Map<String, String> ALLOWED_TYPES =
      Map.of("image/png", "png", "image/jpeg", "jpg", "image/webp", "webp");

  private final RustfsClient rustfsClient;

  public StorageServiceImpl(RustfsClient rustfsClient) {
    this.rustfsClient = rustfsClient;
  }

  @Override
  @PreAuthorize("#request.purpose().isOrgAsset() ? hasRole('ADMIN') : isAuthenticated()")
  public PresignResponse presign(PresignRequest request) {
    String ext = ALLOWED_TYPES.get(request.contentType());
    if (ext == null) {
      throw new ApiException(
          ErrorCode.VALIDATION_ERROR, "Unsupported content type. Allowed: png, jpeg, webp.");
    }
    if (request.sizeBytes() > MAX_BYTES) {
      throw new ApiException(ErrorCode.VALIDATION_ERROR, "File exceeds the 5 MB limit.");
    }
    String key = buildKey(request.purpose(), ext);
    String uploadUrl = rustfsClient.presignPut(key, request.contentType());
    return new PresignResponse(uploadUrl, key, rustfsClient.publicUrl(key));
  }

  private String buildKey(AssetPurpose purpose, String ext) {
    String file = UUID.randomUUID() + "." + ext;
    if (purpose == AssetPurpose.USER_AVATAR) {
      return purpose.keyPrefix() + currentUserId() + "/avatar/" + file;
    }
    return purpose.keyPrefix() + file;
  }

  private UUID currentUserId() {
    Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    if (principal instanceof UserPrincipal up) {
      return up.id();
    }
    throw new ApiException(ErrorCode.UNAUTHENTICATED, "No authenticated user.");
  }
}
