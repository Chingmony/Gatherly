import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { MaterialStatus } from "@/lib/api/types";

/**
 * Material workflow status pill (docs/05 §9 — meaning carried by label + dot, never colour alone).
 * {@link MATERIAL_STATUSES} is the canonical ordered list reused by the status-change selects.
 */
const MAP: Record<MaterialStatus, { variant: NonNullable<BadgeProps["variant"]>; label: string }> = {
  PENDING: { variant: "gray", label: "Pending" },
  IN_PROGRESS: { variant: "blue", label: "In progress" },
  NEEDS_REVIEW: { variant: "orange", label: "Needs review" },
  DONE: { variant: "green", label: "Done" },
  ISSUE: { variant: "danger", label: "Issue" },
};

export const MATERIAL_STATUSES: MaterialStatus[] = [
  "PENDING", "IN_PROGRESS", "NEEDS_REVIEW", "DONE", "ISSUE",
];

export function materialStatusLabel(status: MaterialStatus): string {
  return MAP[status].label;
}

export function MaterialStatusBadge({ status }: { status: MaterialStatus }) {
  const m = MAP[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
