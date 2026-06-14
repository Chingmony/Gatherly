package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * M0 walking-skeleton liveness endpoint. {@code GET /api/v1/ping} (context path {@code /api/v1})
 * returns the uniform success envelope so the frontend can verify end-to-end connectivity.
 */
@RestController
public class PingController {

  @GetMapping("/ping")
  public ApiResponse<Map<String, String>> ping() {
    return ApiResponse.ok("pong", Map.of("status", "ok"));
  }
}
