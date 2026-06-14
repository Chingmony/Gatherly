package com.gatherly.material;

import com.gatherly.material.dto.ChangeStatusRequest;
import com.gatherly.material.dto.CreateMaterialRequest;
import com.gatherly.material.dto.MaterialHistoryResponse;
import com.gatherly.material.dto.MaterialResponse;
import com.gatherly.material.dto.MyTaskResponse;
import com.gatherly.material.dto.UpdateMaterialRequest;
import com.gatherly.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Material endpoints (docs/03 §4.7). Thin controller: every gate lives on {@link MaterialService}.
 * Event-scoped collection routes nest under {@code /events/{eventId}/materials}; the per-material
 * status/history/mine routes are flat under {@code /materials} (the service resolves the owning
 * event for the gate).
 */
@RestController
@RequestMapping("/api/v1")
public class MaterialController {

    private final MaterialService materialService;

    public MaterialController(MaterialService materialService) {
        this.materialService = materialService;
    }

    @GetMapping("/events/{eventId}/materials")
    public List<MaterialResponse> list(@PathVariable UUID eventId) {
        return materialService.listForEvent(eventId);
    }

    @PostMapping("/events/{eventId}/materials")
    public ResponseEntity<MaterialResponse> create(@PathVariable UUID eventId,
                                                   @Valid @RequestBody CreateMaterialRequest req,
                                                   @AuthenticationPrincipal UserPrincipal principal) {
        MaterialResponse body = materialService.create(eventId, req, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @PutMapping("/events/{eventId}/materials/{materialId}")
    public MaterialResponse update(@PathVariable UUID eventId, @PathVariable UUID materialId,
                                   @Valid @RequestBody UpdateMaterialRequest req) {
        return materialService.update(eventId, materialId, req);
    }

    @DeleteMapping("/events/{eventId}/materials/{materialId}")
    public ResponseEntity<Void> delete(@PathVariable UUID eventId, @PathVariable UUID materialId) {
        materialService.delete(eventId, materialId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/materials/{materialId}/status")
    public MaterialResponse changeStatus(@PathVariable UUID materialId,
                                         @Valid @RequestBody ChangeStatusRequest req,
                                         @AuthenticationPrincipal UserPrincipal principal) {
        return materialService.changeStatus(materialId, req, principal);
    }

    @GetMapping("/materials/{materialId}/history")
    public List<MaterialHistoryResponse> history(@PathVariable UUID materialId) {
        return materialService.history(materialId);
    }

    @GetMapping("/materials/mine")
    public List<MyTaskResponse> myTasks(@AuthenticationPrincipal UserPrincipal principal) {
        return materialService.myTasks(principal);
    }
}
