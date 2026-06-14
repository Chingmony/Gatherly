package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.dto.storage.PresignRequest;
import com.gatherly.dto.storage.PresignResponse;
import com.gatherly.service.StorageService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Presigned-upload brokering ({@code docs/04} §4.4). The API never proxies binaries. */
@RestController
@RequestMapping("/storage")
public class StorageController {

  private final StorageService storageService;

  public StorageController(StorageService storageService) {
    this.storageService = storageService;
  }

  @PostMapping("/presign")
  public ApiResponse<PresignResponse> presign(@Valid @RequestBody PresignRequest request) {
    return ApiResponse.ok("Upload URL issued.", storageService.presign(request));
  }
}
