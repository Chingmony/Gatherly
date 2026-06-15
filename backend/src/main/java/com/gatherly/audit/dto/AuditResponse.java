package com.gatherly.audit.dto;

import com.gatherly.audit.domain.AuditLog;

import java.time.Instant;
import java.util.UUID;

/** Admin-facing audit row (docs/08 §5). */
public record AuditResponse(
        UUID id,
        UUID actorId,
        String actorEmail,
        String action,
        String targetType,
        UUID targetId,
        String detail,
        String traceId,
        Instant createdAt
) {
    public static AuditResponse from(AuditLog a) {
        return new AuditResponse(a.getId(), a.getActorId(), a.getActorEmail(), a.getAction(),
                a.getTargetType(), a.getTargetId(), a.getDetail(), a.getTraceId(), a.getCreatedAt());
    }
}
