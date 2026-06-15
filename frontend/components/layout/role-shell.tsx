"use client";

import { useEffect, useState } from "react";
import { AppShell } from "./app-shell";
import type { Role } from "@/lib/roles";

export function RoleShell({ children }: { children: React.ReactNode }) {
  // Render a stable default on the server AND the first client paint so the hydrated markup matches
  // (the real role lives in sessionStorage, which is client-only). Correct it right after mount —
  // this avoids the hydration mismatch that was regenerating the whole tree (and dropping early
  // clicks like "Create event").
  const [role, setRole] = useState<Role>("admin");

  useEffect(() => {
    const s = sessionStorage.getItem("gatherly_role") as Role | null;
    if (s === "subadmin" || s === "handler" || s === "admin") setRole(s);
  }, []);

  return <AppShell role={role}>{children}</AppShell>;
}
