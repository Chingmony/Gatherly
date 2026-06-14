import { serverFetch } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import type { CommandCenterResponse } from "@/lib/api/types";
import { CommandCenter } from "./command-center";

/**
 * Admin Command Center (design `views_admin_control.jsx`, docs/05 §7). Server Component: fetches the
 * dashboard aggregate (cookie-forwarding, never cached) and hands it to the interactive client view.
 * A 403/401 renders a not-authorized state rather than crashing (docs/07 §6).
 */
export default async function DashboardPage() {
  let data: CommandCenterResponse | null = null;
  let denied = false;

  try {
    data = await serverFetch<CommandCenterResponse>("/dashboard/command-center");
  } catch (e) {
    if (e instanceof ApiError && (e.status === 403 || e.status === 401)) {
      denied = true;
    } else {
      throw e;
    }
  }

  if (denied || !data) {
    return (
      <div className="mx-auto max-w-md rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-[15px] font-bold text-[var(--text-strong)]">Not authorized</h1>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">
          The Command Center is available to organization Admins only.
        </p>
      </div>
    );
  }

  return <CommandCenter data={data} />;
}
