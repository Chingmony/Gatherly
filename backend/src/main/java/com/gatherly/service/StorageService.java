package com.gatherly.service;

import com.gatherly.domain.AssetPurpose;
import com.gatherly.dto.storage.PresignRequest;
import com.gatherly.dto.storage.PresignResponse;

/** Rustfs presign brokering with purpose-scoped authorization ({@code docs/04} §4.4). */
public interface StorageService {

  PresignResponse presign(PresignRequest request);

  /**
   * Server-side upload — used when the API brokers the bytes (the browser can't reach storage
   * directly). Validates content-type/size, stores the object, and returns the key to persist.
   */
  String store(AssetPurpose purpose, byte[] content, String contentType);
}
