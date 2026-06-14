package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * M0 walking-skeleton liveness endpoint. {@code GET /api/v1/ping} (context path {@code /api/v1})
 * returns the uniform success envelope so the frontend can verify end-to-end connectivity.
 */
@Tag(name = "Health", description = "Liveness and connectivity probes.")
@RestController
public class PingController {

  @Operation(
      summary = "Liveness probe",
      description =
          "Returns the uniform success envelope with payload `{\"status\":\"ok\"}`. Public — no"
              + " authentication required. Used by the frontend and uptime monitors to confirm the"
              + " API is reachable end-to-end.")
  @GetMapping("/ping")
  public ApiResponse<Map<String, String>> ping() {
    return ApiResponse.ok("pong", Map.of("status", "ok"));
  }
}
