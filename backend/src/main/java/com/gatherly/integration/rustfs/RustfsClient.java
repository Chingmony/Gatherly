package com.gatherly.integration.rustfs;

import com.gatherly.config.RustfsProperties;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.BucketAlreadyExistsException;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
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

  /** Create the bucket if missing. Best-effort: a storage outage logs a warning, never throws. */
  public void ensureBucketExists() {
    try {
      s3Client.headBucket(HeadBucketRequest.builder().bucket(props.bucket()).build());
      return; // already exists
    } catch (NoSuchBucketException e) {
      // missing — create below
    } catch (S3Exception e) {
      // Rustfs/MinIO surface a missing bucket on HEAD as a generic 404, not NoSuchBucketException.
      if (e.statusCode() != 404) {
        log.warn("Bucket check failed for '{}': {}", props.bucket(), e.getMessage());
        return;
      }
    } catch (RuntimeException e) {
      log.warn("Bucket check failed for '{}': {}", props.bucket(), e.getMessage());
      return;
    }
    createBucketQuietly();
  }

  /** Create the bucket, tolerating the race where it already exists. Never throws. */
  private void createBucketQuietly() {
    try {
      s3Client.createBucket(CreateBucketRequest.builder().bucket(props.bucket()).build());
      log.info("Created storage bucket '{}'.", props.bucket());
    } catch (BucketAlreadyExistsException | BucketAlreadyOwnedByYouException e) {
      // Concurrent startup created it first — fine.
    } catch (RuntimeException e) {
      log.warn("Could not create bucket '{}': {}", props.bucket(), e.getMessage());
    }
  }

  /** Upload bytes to the bucket server-side (used when the API brokers the upload, not the client). */
  public void putObject(String key, byte[] content, String contentType) {
    PutObjectRequest request =
        PutObjectRequest.builder().bucket(props.bucket()).key(key).contentType(contentType).build();
    try {
      s3Client.putObject(request, RequestBody.fromBytes(content));
    } catch (NoSuchBucketException e) {
      // Bucket vanished or was never created — create it and retry once so the upload succeeds.
      createBucketQuietly();
      s3Client.putObject(request, RequestBody.fromBytes(content));
    } catch (S3Exception e) {
      if (e.statusCode() != 404) {
        throw e;
      }
      createBucketQuietly();
      s3Client.putObject(request, RequestBody.fromBytes(content));
    }
  }

  /** Issue a short-lived presigned GET URL for reading an object, or null for a missing key. */
  public String presignGet(String key) {
    if (key == null || key.isBlank()) {
      return null;
    }
    GetObjectRequest objectRequest =
        GetObjectRequest.builder().bucket(props.bucket()).key(key).build();
    GetObjectPresignRequest presignRequest =
        GetObjectPresignRequest.builder()
            .signatureDuration(Duration.ofSeconds(props.presignTtlSeconds()))
            .getObjectRequest(objectRequest)
            .build();
    return presigner.presignGetObject(presignRequest).url().toString();
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
