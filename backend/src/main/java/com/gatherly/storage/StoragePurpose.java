package com.gatherly.storage;

/**
 * Asset purpose for a presign request (docs/04 §4.3). Drives both the object-key layout and the
 * authorization gate: {@code ORG_*} require Admin, {@code USER_AVATAR} is self-scoped.
 */
public enum StoragePurpose {

    ORG_LOGO("org/logo/"),
    ORG_BANNER("org/banner/"),
    USER_AVATAR("user/"); // key becomes user/{userId}/avatar/{uuid}.{ext}

    private final String prefix;

    StoragePurpose(String prefix) {
        this.prefix = prefix;
    }

    public String prefix() {
        return prefix;
    }
}
