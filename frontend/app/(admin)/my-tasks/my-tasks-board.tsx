"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { changeMaterialStatus } from "@/lib/api/materials";
import { ApiError } from "@/lib/api/client";
import type { MaterialStatus, MyTaskResponse } from "@/lib/api/types";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import {
  MATERIAL_STATUSES, MaterialStatusBadge, materialStatusLabel,
} from "@/components/material-status-badge";

type TaskSort = "status" | "event" | "name";

/**
 * Handler task board (docs/05 §6). Status changes go through the server, which enforces the state
 * machine and the elevated-transition rule — a Handler advancing toward DONE on their own material
 * gets a clear 403/409 surfaced inline rather than a silent failure.
 */
export function MyTasksBoard({ tasks }: { tasks: MyTaskResponse[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MaterialStatus | "ALL">("ALL");
  const [sort, setSort] = useState<TaskSort>("status");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = tasks.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (!q) return true;
      return `${t.name} ${t.eventTitle ?? ""}`.toLowerCase().includes(q);
    });
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "event": return (a.eventTitle ?? "").localeCompare(b.eventTitle ?? "");
        case "name": return a.name.localeCompare(b.name);
        case "status":
        default: return MATERIAL_STATUSES.indexOf(a.status) - MATERIAL_STATUSES.indexOf(b.status);
      }
    });
  }, [tasks, query, statusFilter, sort]);

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

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder="Search tasks or event…" className="min-w-[220px] flex-1" />
        <Select
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as MaterialStatus | "ALL")}
          aria-label="Filter by status"
          className="w-auto min-w-[9.5rem]"
          options={[{ value: "ALL", label: "All statuses" }, ...MATERIAL_STATUSES.map((s) => ({ value: s, label: materialStatusLabel(s) }))]}
        />
        <Select
          value={sort}
          onChange={(v) => setSort(v as TaskSort)}
          aria-label="Sort tasks"
          className="w-auto min-w-[9rem]"
          options={[
            { value: "status", label: "Sort: Status" },
            { value: "event", label: "Sort: Event" },
            { value: "name", label: "Sort: Task name" },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              <th className="px-4 py-3">Task</th><th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Status</th><th className="px-4 py-3">Advance</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-[13px] text-[var(--text-faint)]">No tasks match your filters.</td></tr>
            )}
            {visible.map((t) => (
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
