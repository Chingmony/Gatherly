package com.gatherly.storage;

import com.gatherly.common.error.AppException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.security.UserPrincipal;
import com.gatherly.storage.dto.PresignRequest;
import com.gatherly.storage.dto.PresignResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * Brokers presigned PUT URLs to Rustfs (docs/04 §4.4, docs/06 §3). Binaries never traverse the
 * Java heap — the client uploads straight to storage and commits the returned object key back to
 * the data model. Authorization is purpose-scoped here on the service layer (docs/04 §4.4 step 2):
 * {@code ORG_*} require Admin; {@code USER_AVATAR} is self-scoped to the caller.
 */
@Service
public class StorageService {

    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/png", "png",
            "image/jpeg", "jpg",
            "image/webp", "webp");

    private final S3Presigner presigner;
    private final StorageProperties props;

    public StorageService(S3Presigner presigner, StorageProperties props) {
        this.presigner = presigner;
        this.props = props;
    }

    public PresignResponse presign(PresignRequest req) {
        UserPrincipal principal = currentPrincipal();
        authorize(req.purpose(), principal);
        validate(req);

        String key = buildKey(req.purpose(), principal, req.contentType());
        PutObjectRequest objectRequest = PutObjectRequest.builder()
                .bucket(props.getBucket())
                .key(key)
                .contentType(req.contentType())
                .build();
        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofSeconds(props.getPresignTtlSeconds()))
                .putObjectRequest(objectRequest)
                .build();
        PresignedPutObjectRequest presigned = presigner.presignPutObject(presignRequest);

        return new PresignResponse(presigned.url().toString(), key, publicUrl(key));
    }

    // ---- Authorization (docs/04 §4.4 step 2) --------------------------------

    private void authorize(StoragePurpose purpose, UserPrincipal principal) {
        switch (purpose) {
            case ORG_LOGO, ORG_BANNER -> {
                if (!isAdmin()) {
                    throw new AccessDeniedException("Only an admin may upload organization assets.");
                }
            }
            case USER_AVATAR -> {
                // Self-scoped: the key embeds the caller's own id, so any authenticated user may
                // presign their avatar — they can never target another user's key.
                if (principal == null) {
                    throw new AccessDeniedException("Authentication is required.");
                }
            }
        }
    }

    private void validate(PresignRequest req) {
        if (!props.getAllowedContentTypes().contains(req.contentType())) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "Unsupported content type. Allowed: " + String.join(", ", props.getAllowedContentTypes()));
        }
        if (req.sizeBytes() > props.getMaxUploadBytes()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "File exceeds the maximum size of " + props.getMaxUploadBytes() + " bytes.");
        }
    }

    private String buildKey(StoragePurpose purpose, UserPrincipal principal, String contentType) {
        String ext = EXTENSIONS.getOrDefault(contentType, "bin");
        String file = UUID.randomUUID() + "." + ext;
        if (purpose == StoragePurpose.USER_AVATAR) {
            return purpose.prefix() + principal.id() + "/avatar/" + file;
        }
        return purpose.prefix() + file;
    }

    private String publicUrl(String key) {
        String base = props.getPublicBaseUrl();
        if (base == null || base.isBlank()) {
            return null;
        }
        return base.replaceAll("/$", "") + "/" + key;
    }

    private UserPrincipal currentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal up) {
            return up;
        }
        return null;
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }
}
