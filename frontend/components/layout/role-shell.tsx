"use client";

import { useEffect, useState } from "react";
import { AppShell } from "./app-shell";
import type { Role } from "@/lib/roles";

export function RoleShell({ children }: { children: React.ReactNode }) {
  // The server can't read sessionStorage, so the server render and the first client render must
  // start from the SAME fixed role — otherwise the sidebar nav differs and React throws a
  // hydration mismatch. We adopt the persisted role only after mount.
  const [role, setRole] = useState<Role>("admin");

  useEffect(() => {
    const stored = sessionStorage.getItem("gatherly_role") as Role | null;
    if (stored === "subadmin" || stored === "handler") setRole(stored);
  }, []);

  return <AppShell role={role}>{children}</AppShell>;
}
