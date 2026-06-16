package com.gatherly.domain;

/**
 * Upload purpose for a presigned object ({@code docs/04} §4.3). Drives both the object-key layout
 * and the authorization gate ({@code ORG_*} → Admin; {@code USER_AVATAR} → self).
 */
public enum AssetPurpose {
  ORG_LOGO("org/logo/"),
  ORG_BANNER("org/banner/"),
  USER_AVATAR("user/"),
  EVENT_COVER("event/cover/");

  private final String keyPrefix;

  AssetPurpose(String keyPrefix) {
    this.keyPrefix = keyPrefix;
  }

  public String keyPrefix() {
    return keyPrefix;
  }

  public boolean isOrgAsset() {
    return this == ORG_LOGO || this == ORG_BANNER;
  }
}
