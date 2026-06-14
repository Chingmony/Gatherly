"use client";

import { useState } from "react";
import { AppShell } from "./app-shell";
import type { Role } from "@/lib/roles";

function readRole(): Role {
  if (typeof window === "undefined") return "handler";
  const s = sessionStorage.getItem("gatherly_role") as Role | null;
  return s === "subadmin" || s === "handler" ? s : "admin";
}

export function RoleShell({ children }: { children: React.ReactNode }) {
  const [role] = useState<Role>(readRole);
  return <AppShell role={role}>{children}</AppShell>;
}
