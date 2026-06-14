package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.dto.storage.PresignRequest;
import com.gatherly.dto.storage.PresignResponse;
import com.gatherly.service.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Presigned-upload brokering ({@code docs/04} §4.4). The API never proxies binaries. */
@Tag(
    name = "Storage",
    description =
        "Brokers short-lived presigned upload URLs for S3-compatible (Rustfs) storage. The frontend"
            + " uploads/downloads binaries directly — the API never proxies file bytes.")
@RestController
@RequestMapping("/storage")
public class StorageController {

  private final StorageService storageService;

  public StorageController(StorageService storageService) {
    this.storageService = storageService;
  }

  @Operation(
      summary = "Issue a presigned upload URL",
      description =
          "Returns a short-lived presigned PUT URL and object key for the given purpose, content"
              + " type, and size. Org-asset purposes (e.g. logo/banner) require ADMIN; other"
              + " purposes require any authenticated user. Errors: 403 FORBIDDEN; 400"
              + " VALIDATION_ERROR for invalid content type/size.")
  @PostMapping("/presign")
  public ApiResponse<PresignResponse> presign(@Valid @RequestBody PresignRequest request) {
    return ApiResponse.ok("Upload URL issued.", storageService.presign(request));
  }
}
