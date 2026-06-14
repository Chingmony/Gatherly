package com.gatherly.material;

import com.gatherly.material.dto.SupplyItemRequest;
import com.gatherly.material.dto.SupplyItemResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Main supply list (docs/03 §4.6). Thin controller: read is authenticated; the {@code hasRole('ADMIN')}
 * gates on create/update/delete live on {@link MainSupplyItemService}. DELETE is Sub-admin-forbidden.
 */
@RestController
@RequestMapping("/api/v1/supply-items")
public class SupplyItemController {

    private final MainSupplyItemService supplyService;

    public SupplyItemController(MainSupplyItemService supplyService) {
        this.supplyService = supplyService;
    }

    @GetMapping
    public List<SupplyItemResponse> list() {
        return supplyService.list();
    }

    @PostMapping
    public ResponseEntity<SupplyItemResponse> create(@Valid @RequestBody SupplyItemRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplyService.create(req));
    }

    @PutMapping("/{id}")
    public SupplyItemResponse update(@PathVariable UUID id, @Valid @RequestBody SupplyItemRequest req) {
        return supplyService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        supplyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
