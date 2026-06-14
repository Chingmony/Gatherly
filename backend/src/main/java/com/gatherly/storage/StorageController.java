package com.gatherly.storage;

import com.gatherly.storage.dto.PresignRequest;
import com.gatherly.storage.dto.PresignResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Presign endpoint (docs/04 §4.4). Authenticated; the purpose-scoped gate (Admin for org assets,
 * self for avatars) is enforced inside {@link StorageService}.
 */
@RestController
@RequestMapping("/api/v1/storage")
public class StorageController {

    private final StorageService storageService;

    public StorageController(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping("/presign")
    public PresignResponse presign(@Valid @RequestBody PresignRequest req) {
        return storageService.presign(req);
    }
}
