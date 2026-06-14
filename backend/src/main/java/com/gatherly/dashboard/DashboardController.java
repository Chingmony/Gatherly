package com.gatherly.dashboard;

import com.gatherly.dashboard.dto.CommandCenterResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Dashboard endpoints (docs/03 §4.13). Thin controller: authentication is enforced by the filter
 * chain (layer 1) and the Admin-only gate lives on {@link DashboardService} (layer 2, docs/03 §3).
 */
@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /** Admin Command Center aggregate — global oversight across every event (docs/06 §11). */
    @GetMapping("/command-center")
    public CommandCenterResponse commandCenter() {
        return dashboardService.commandCenter();
    }
}
