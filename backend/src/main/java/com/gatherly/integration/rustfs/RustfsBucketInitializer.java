package com.gatherly.integration.rustfs;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Ensures the storage bucket exists on startup so the first avatar/org-asset upload doesn't fail
 * with {@code NoSuchBucket}. Best-effort — {@link RustfsClient#ensureBucketExists()} never throws,
 * so a storage outage cannot block application startup.
 */
@Component
public class RustfsBucketInitializer implements ApplicationRunner {

  private final RustfsClient rustfsClient;

  public RustfsBucketInitializer(RustfsClient rustfsClient) {
    this.rustfsClient = rustfsClient;
  }

  @Override
  public void run(ApplicationArguments args) {
    rustfsClient.ensureBucketExists();
  }
}
