"use client";

import { useEffect, useState } from "react";
import { AppShell } from "./app-shell";
import type { Role } from "@/lib/roles";

function readRole(): Role {
  const s = sessionStorage.getItem("gatherly_role") as Role | null;
  return s === "subadmin" || s === "handler" ? s : "admin";
}

export function RoleShell({ children }: { children: React.ReactNode }) {
  // Role lives in sessionStorage (client-only). Rendering it during SSR would
  // produce different chrome (sidebar items, mobile nav, FAB) than the client's
  // first paint → hydration mismatch. Gate on mount: SSR and the client's first
  // render both emit the neutral placeholder, so they agree.
  const [role, setRole] = useState<Role | null>(null);
  useEffect(() => setRole(readRole()), []);

  if (role === null) {
    return <div suppressHydrationWarning style={{ minHeight: "100vh", background: "var(--bg)" }} />;
  }

  return <AppShell role={role}>{children}</AppShell>;
}
