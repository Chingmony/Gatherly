package com.gatherly.config;

import java.net.URI;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * S3-compatible client + presigner for Rustfs ({@code docs/04} §4.5). Path-style access is required
 * for non-AWS S3 endpoints. Clients connect lazily, so a storage outage never blocks startup.
 */
@Configuration
public class RustfsConfig {

  private final RustfsProperties props;

  public RustfsConfig(RustfsProperties props) {
    this.props = props;
  }

  @Bean
  public S3Client s3Client() {
    return S3Client.builder()
        .endpointOverride(URI.create(props.endpoint()))
        .region(Region.of(props.region()))
        .credentialsProvider(staticCreds())
        .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
        .build();
  }

  @Bean
  public S3Presigner s3Presigner() {
    return S3Presigner.builder()
        .endpointOverride(URI.create(props.endpoint()))
        .region(Region.of(props.region()))
        .credentialsProvider(staticCreds())
        .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
        .build();
  }

  private StaticCredentialsProvider staticCreds() {
    return StaticCredentialsProvider.create(
        AwsBasicCredentials.create(props.accessKey(), props.secretKey()));
  }
}
