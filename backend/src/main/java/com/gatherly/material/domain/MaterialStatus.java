package com.gatherly.material.domain;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Material workflow state (docs/02 §5, docs/02 §4 enum catalog). The 5-state machine and its
 * legality live here so both the service and its tests share one source of truth.
 *
 * <p>Two concerns are modelled separately:
 * <ul>
 *   <li>{@link #canTransitionTo(MaterialStatus)} — is the edge legal at all (→ {@code 409
 *       ILLEGAL_TRANSITION} otherwise)?</li>
 *   <li>{@link #isElevated(MaterialStatus)} — is the edge reserved to an event MANAGER/Admin even
 *       though a Handler holds {@code canUpdateMaterial} (approval, send-back, issue-resolution,
 *       reopen)? The service enforces this as step 3 of {@code changeStatus} (docs/06 §5).</li>
 * </ul>
 */
public enum MaterialStatus {
    PENDING,
    IN_PROGRESS,
    NEEDS_REVIEW,
    DONE,
    ISSUE;

    private static final Map<MaterialStatus, Set<MaterialStatus>> LEGAL = new EnumMap<>(MaterialStatus.class);

    static {
        // Forward work path + raise-issue from any active state (docs/02 §5 diagram + table).
        LEGAL.put(PENDING, EnumSet.of(IN_PROGRESS, NEEDS_REVIEW, ISSUE));
        LEGAL.put(IN_PROGRESS, EnumSet.of(NEEDS_REVIEW, ISSUE));
        LEGAL.put(NEEDS_REVIEW, EnumSet.of(DONE, IN_PROGRESS, ISSUE)); // approve / send back / raise issue
        LEGAL.put(ISSUE, EnumSet.of(PENDING, IN_PROGRESS));            // issue resolved
        LEGAL.put(DONE, EnumSet.of(PENDING, IN_PROGRESS, NEEDS_REVIEW, ISSUE)); // reopen → *
    }

    /** Is the edge {@code this → to} a legal transition (excludes self-edges)? */
    public boolean canTransitionTo(MaterialStatus to) {
        return to != null && this != to
                && LEGAL.getOrDefault(this, EnumSet.noneOf(MaterialStatus.class)).contains(to);
    }

    /**
     * Edges reserved to an event MANAGER/Admin (docs/02 §5): review approval ({@code NEEDS_REVIEW→DONE}),
     * send-back ({@code NEEDS_REVIEW→IN_PROGRESS}), issue resolution ({@code ISSUE→PENDING/IN_PROGRESS}),
     * and reopen ({@code DONE→*}). A Handler may never perform these even on their own material.
     */
    public boolean isElevated(MaterialStatus to) {
        return switch (this) {
            case NEEDS_REVIEW -> to == DONE || to == IN_PROGRESS;
            case ISSUE -> to == PENDING || to == IN_PROGRESS;
            case DONE -> true;
            default -> false;
        };
    }
}
