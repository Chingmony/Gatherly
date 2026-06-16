import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileNav } from "./mobile-nav";
import { HandlerFab } from "./handler-fab";
import { ThemeProvider } from "@/components/theme-provider";
import type { Role } from "@/lib/roles";

interface AppShellProps {
  role: Role;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AppShell({ role, title, subtitle, children }: AppShellProps) {
  return (
    <ThemeProvider>
      <div className="app-shell">
        <Sidebar role={role} />
        <div className="main-content">
          <Topbar role={role} title={title} subtitle={subtitle} />
          <div className="page-scroll">
            <div className="page-inner view-anim">{children}</div>
          </div>
        </div>
      </div>
      {role === "handler" && <MobileNav />}
      {role === "handler" && <HandlerFab />}
    </ThemeProvider>
  );
}
