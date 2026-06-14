package com.gatherly.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Rustfs (S3-compatible object storage) config bound from {@code app.rustfs.*} ({@code docs/04}
 * §4.2). The API only brokers presigned URLs; binaries never stream through it.
 *
 * @param endpoint cluster endpoint URL
 * @param region region label for SDK signing
 * @param accessKey / @param secretKey credentials
 * @param bucket target bucket
 * @param publicBaseUrl base URL for public-read assets ({@code publicBaseUrl + "/" + key})
 * @param presignTtlSeconds presigned-URL lifetime (default 300)
 */
@ConfigurationProperties(prefix = "app.rustfs")
public record RustfsProperties(
    String endpoint,
    String region,
    String accessKey,
    String secretKey,
    String bucket,
    String publicBaseUrl,
    long presignTtlSeconds) {}
