export type Role = "admin" | "subadmin" | "handler";

/** Map the backend global role to the UI role vocabulary. Unknown/USER → least-privileged handler. */
export function uiRoleFromGlobal(globalRole: string): Role {
  if (globalRole === "ADMIN") return "admin";
  if (globalRole === "SUB_ADMIN") return "subadmin";
  return "handler";
}

/** Shared role → display presentation (label, subtitle, badge colors). */
export const ROLE_META: Record<Role, { label: string; sub: string; soft: string; color: string }> = {
  admin: { label: "Admin", sub: "Full access", soft: "var(--violet-soft)", color: "var(--violet)" },
  subadmin: { label: "Manager", sub: "Event-scoped", soft: "var(--blue-soft)", color: "var(--blue)" },
  handler: { label: "Handler", sub: "Task & scan access", soft: "var(--green-soft)", color: "var(--green-600)" },
};
