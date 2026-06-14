package com.gatherly.service;

import com.gatherly.dto.storage.PresignRequest;
import com.gatherly.dto.storage.PresignResponse;

/** Rustfs presign brokering with purpose-scoped authorization ({@code docs/04} §4.4). */
public interface StorageService {

  PresignResponse presign(PresignRequest request);
}
