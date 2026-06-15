"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { changeMaterialStatus } from "@/lib/api/materials";
import { ApiError } from "@/lib/api/client";
import type { MaterialStatus, MyTaskResponse } from "@/lib/api/types";
import { Select } from "@/components/ui/select";
import {
  MATERIAL_STATUSES, MaterialStatusBadge, materialStatusLabel,
} from "@/components/material-status-badge";

/**
 * Handler task board (docs/05 §6). Status changes go through the server, which enforces the state
 * machine and the elevated-transition rule — a Handler advancing toward DONE on their own material
 * gets a clear 403/409 surfaced inline rather than a silent failure.
 */
export function MyTasksBoard({ tasks }: { tasks: MyTaskResponse[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function setStatus(materialId: string, toStatus: MaterialStatus) {
    setError(null);
    try {
      await changeMaterialStatus(materialId, { toStatus });
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update status.");
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[13px] text-[var(--text-muted)] shadow-[var(--shadow-card)]">
        You have no assigned tasks right now.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p role="alert" className="text-[13px] font-semibold text-[var(--danger)]">{error}</p>}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              <th className="px-4 py-3">Task</th><th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Status</th><th className="px-4 py-3">Advance</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 text-[13px] font-semibold text-[var(--text)]">
                  {t.name}{t.quantity != null && <span className="ml-1.5 text-[12px] text-[var(--text-faint)]">×{t.quantity}</span>}
                </td>
                <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">
                  <Link href={`/events/${t.eventId}`} className="hover:text-[var(--primary)]">{t.eventTitle ?? "—"}</Link>
                </td>
                <td className="px-4 py-3"><MaterialStatusBadge status={t.status} /></td>
                <td className="px-4 py-3">
                  <Select
                    className="min-w-[9rem]"
                    value={t.status}
                    onChange={(v) => setStatus(t.id, v as MaterialStatus)}
                    aria-label="Status"
                    options={MATERIAL_STATUSES.map((s) => ({ value: s, label: materialStatusLabel(s) }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
