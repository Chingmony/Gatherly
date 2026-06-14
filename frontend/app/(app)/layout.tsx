import { RoleShell } from "@/components/layout/role-shell";

export default function SharedAppLayout({ children }: { children: React.ReactNode }) {
  return <RoleShell>{children}</RoleShell>;
}
