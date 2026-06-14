package com.gatherly.domain;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Material workflow state ({@code docs/02} §5, {@code docs/06} §5). Encodes both transition
 * legality and which transitions are approval-level (manager/Admin only) versus handler-allowed.
 *
 * <pre>
 *   PENDING → IN_PROGRESS → NEEDS_REVIEW → DONE
 *   NEEDS_REVIEW → IN_PROGRESS (send back)   any active → ISSUE   ISSUE → PENDING/IN_PROGRESS   DONE → * (reopen)
 * </pre>
 */
public enum MaterialStatus {
  PENDING,
  IN_PROGRESS,
  NEEDS_REVIEW,
  DONE,
  ISSUE;

  private static final Map<MaterialStatus, Set<MaterialStatus>> LEGAL =
      Map.of(
          PENDING, EnumSet.of(IN_PROGRESS, ISSUE),
          IN_PROGRESS, EnumSet.of(NEEDS_REVIEW, ISSUE),
          NEEDS_REVIEW, EnumSet.of(DONE, IN_PROGRESS, ISSUE),
          DONE, EnumSet.of(PENDING, IN_PROGRESS, NEEDS_REVIEW, ISSUE),
          ISSUE, EnumSet.of(PENDING, IN_PROGRESS));

  public boolean canTransitionTo(MaterialStatus target) {
    return LEGAL.getOrDefault(this, Set.of()).contains(target);
  }

  /**
   * True if moving to {@code target} is an approval/send-back/reopen/resolve action restricted to a
   * MANAGER/Admin even when a Handler passed the {@code canUpdateMaterial} gate ({@code docs/06} §5
   * step 3). Handlers may only drive their own material into {@code IN_PROGRESS}/{@code
   * NEEDS_REVIEW}/{@code ISSUE} from an active (non-terminal) state.
   */
  public boolean requiresManager(MaterialStatus target) {
    return switch (this) {
      case NEEDS_REVIEW -> target == DONE || target == IN_PROGRESS; // approve or send back
      case DONE -> true; // reopen
      case ISSUE -> true; // resolve
      default -> false; // PENDING / IN_PROGRESS → ... are handler-allowed
    };
  }
}
