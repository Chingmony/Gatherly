package com.gatherly.integration.rustfs;

import com.gatherly.config.RustfsProperties;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

/**
 * Thin S3 SDK wrapper for Rustfs ({@code docs/04} §4.5). Issues presigned PUT URLs, checks object
 * existence (HEAD), and deletes superseded objects. No business logic.
 */
@Component
public class RustfsClient {

  private static final Logger log = LoggerFactory.getLogger(RustfsClient.class);

  private final S3Client s3Client;
  private final S3Presigner presigner;
  private final RustfsProperties props;

  public RustfsClient(S3Client s3Client, S3Presigner presigner, RustfsProperties props) {
    this.s3Client = s3Client;
    this.presigner = presigner;
    this.props = props;
  }

  /** Issue a presigned PUT URL the client uploads to directly. */
  public String presignPut(String key, String contentType) {
    PutObjectRequest objectRequest =
        PutObjectRequest.builder().bucket(props.bucket()).key(key).contentType(contentType).build();
    PutObjectPresignRequest presignRequest =
        PutObjectPresignRequest.builder()
            .signatureDuration(Duration.ofSeconds(props.presignTtlSeconds()))
            .putObjectRequest(objectRequest)
            .build();
    return presigner.presignPutObject(presignRequest).url().toString();
  }

  /** True if the object exists. Connectivity errors propagate (caller decides best-effort). */
  public boolean objectExists(String key) {
    try {
      s3Client.headObject(HeadObjectRequest.builder().bucket(props.bucket()).key(key).build());
      return true;
    } catch (NoSuchKeyException e) {
      return false;
    }
  }

  /** Best-effort delete of a superseded object; storage failures are logged, never thrown. */
  public void deleteQuietly(String key) {
    if (key == null || key.isBlank()) {
      return;
    }
    try {
      s3Client.deleteObject(DeleteObjectRequest.builder().bucket(props.bucket()).key(key).build());
    } catch (RuntimeException ex) {
      log.warn("Failed to delete superseded object {}: {}", key, ex.getMessage());
    }
  }

  public String publicUrl(String key) {
    if (key == null || props.publicBaseUrl() == null || props.publicBaseUrl().isBlank()) {
      return null;
    }
    String base = props.publicBaseUrl().replaceAll("/+$", "");
    return base + "/" + key;
  }
}
