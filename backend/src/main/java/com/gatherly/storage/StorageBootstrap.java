package com.gatherly.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.BucketAlreadyExistsException;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;

/**
 * On startup (when storage is enabled), make the Rustfs/MinIO bucket usable for the browser
 * upload flow (docs/04 §4): ensure the bucket exists and grant <b>public-read</b> on objects so
 * {@code publicUrl} is fetchable. Best-effort — a storage hiccup logs a warning but never blocks
 * app startup.
 *
 * <p>CORS for the browser PUT is handled by the storage server itself (MinIO honors
 * {@code MINIO_API_CORS_ALLOW_ORIGIN}, default {@code *}); the S3 {@code PutBucketCors} API is not
 * implemented by MinIO, so it is intentionally not called here.
 */
@Component
public class StorageBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(StorageBootstrap.class);

    private final S3Client s3;
    private final StorageProperties props;

    public StorageBootstrap(S3Client s3, StorageProperties props) {
        this.s3 = s3;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!props.isEnabled()) {
            log.debug("Storage disabled — skipping bucket bootstrap.");
            return;
        }
        String bucket = props.getBucket();
        try {
            s3.createBucket(b -> b.bucket(bucket));
            log.info("Created storage bucket '{}'", bucket);
        } catch (BucketAlreadyOwnedByYouException | BucketAlreadyExistsException e) {
            log.debug("Storage bucket '{}' already exists", bucket);
        } catch (Exception e) {
            log.warn("Could not ensure storage bucket '{}': {}", bucket, e.getMessage());
        }

        // Public-read on objects so publicUrl (publicBaseUrl + key) is fetchable.
        try {
            String policy = """
                    {"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":"*",
                    "Action":["s3:GetObject"],"Resource":["arn:aws:s3:::%s/*"]}]}""".formatted(bucket);
            s3.putBucketPolicy(b -> b.bucket(bucket).policy(policy));
            log.info("Storage bucket '{}' ready (public-read)", bucket);
        } catch (Exception e) {
            log.warn("Could not set public-read policy on '{}': {}", bucket, e.getMessage());
        }
    }
}
