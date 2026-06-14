package com.gatherly.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Rustfs (S3-compatible) object-storage configuration (docs/04 §4.2). All values come from env
 * with dev-friendly defaults so presigning works locally/in tests without a live cluster.
 */
@ConfigurationProperties(prefix = "gatherly.storage")
public class StorageProperties {

    /** When false, presign still works (offline signing) but object existence is not verified. */
    private boolean enabled = false;
    private String endpoint = "http://localhost:9000";
    private String region = "us-east-1";
    private String accessKey = "rustfs";
    private String secretKey = "rustfs";
    private String bucket = "gatherly";
    /** Public-read CDN/base URL; {@code publicUrl = publicBaseUrl + "/" + key} (docs/04 §4.3). */
    private String publicBaseUrl = "http://localhost:9000/gatherly";
    private long presignTtlSeconds = 300;
    private long maxUploadBytes = 5 * 1024 * 1024; // 5 MB
    private List<String> allowedContentTypes = List.of("image/png", "image/jpeg", "image/webp");

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getAccessKey() {
        return accessKey;
    }

    public void setAccessKey(String accessKey) {
        this.accessKey = accessKey;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public void setSecretKey(String secretKey) {
        this.secretKey = secretKey;
    }

    public String getBucket() {
        return bucket;
    }

    public void setBucket(String bucket) {
        this.bucket = bucket;
    }

    public String getPublicBaseUrl() {
        return publicBaseUrl;
    }

    public void setPublicBaseUrl(String publicBaseUrl) {
        this.publicBaseUrl = publicBaseUrl;
    }

    public long getPresignTtlSeconds() {
        return presignTtlSeconds;
    }

    public void setPresignTtlSeconds(long presignTtlSeconds) {
        this.presignTtlSeconds = presignTtlSeconds;
    }

    public long getMaxUploadBytes() {
        return maxUploadBytes;
    }

    public void setMaxUploadBytes(long maxUploadBytes) {
        this.maxUploadBytes = maxUploadBytes;
    }

    public List<String> getAllowedContentTypes() {
        return allowedContentTypes;
    }

    public void setAllowedContentTypes(List<String> allowedContentTypes) {
        this.allowedContentTypes = allowedContentTypes;
    }
}
