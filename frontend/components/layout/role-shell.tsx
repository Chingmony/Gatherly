"use client";

import { useEffect, useState } from "react";
import { AppShell } from "./app-shell";
import { getRole } from "@/lib/auth/session";
import type { Role } from "@/lib/roles";

export function RoleShell({ children }: { children: React.ReactNode }) {
  // Role lives in client storage (sessionStorage + the gatherly_role cookie).
  // Rendering it during SSR would produce different chrome (sidebar items, mobile
  // nav, FAB) than the client's first paint → hydration mismatch. Gate on mount:
  // SSR and the client's first render both emit the neutral placeholder, so they
  // agree. `getRole()` reads sessionStorage then the persistent cookie, so the
  // handler shell survives an installed-PWA launch where sessionStorage is empty.
  const [role, setRole] = useState<Role | null>(null);
  useEffect(() => setRole(getRole() ?? "admin"), []);

  if (role === null) {
    return <div suppressHydrationWarning style={{ minHeight: "100vh", background: "var(--bg)" }} />;
  }

  return <AppShell role={role}>{children}</AppShell>;
}
