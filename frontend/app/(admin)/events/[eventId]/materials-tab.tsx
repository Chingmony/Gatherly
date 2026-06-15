"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  changeMaterialStatus, createMaterial, deleteMaterial, materialHistory,
} from "@/lib/api/materials";
import { ApiError } from "@/lib/api/client";
import type {
  AssignmentResponse, MaterialHistoryResponse, MaterialResponse, MaterialStatus,
} from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  MATERIAL_STATUSES, MaterialStatusBadge, materialStatusLabel,
} from "@/components/material-status-badge";

const FIELD =
  "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]";

/**
 * Materials & tasks (docs/03 §4.7, docs/06 §5). Managers/admins create + assign and delete; anyone
 * who can update a material advances its status (the server enforces the 5-state machine and the
 * elevated-transition rule — Handlers can't approve/reopen). History is loaded on demand.
 */
export function MaterialsTab({
  eventId,
  materials,
  crew,
  canManage,
}: {
  eventId: string;
  materials: MaterialResponse[];
  crew: AssignmentResponse[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Record<string, MaterialHistoryResponse[]>>({});
  const [openHistory, setOpenHistory] = useState<string | null>(null);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createMaterial(eventId, {
        name: name.trim(),
        quantity: quantity ? Number(quantity) : undefined,
        assignedTo: assignedTo || undefined,
      });
      setName("");
      setQuantity("");
      setAssignedTo("");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create material.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(materialId: string, toStatus: MaterialStatus) {
    setError(null);
    try {
      await changeMaterialStatus(materialId, { toStatus });
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update status.");
    }
  }

  async function remove(materialId: string) {
    setError(null);
    try {
      await deleteMaterial(eventId, materialId);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not delete material.");
    }
  }

  async function toggleHistory(materialId: string) {
    if (openHistory === materialId) {
      setOpenHistory(null);
      return;
    }
    setOpenHistory(materialId);
    if (!history[materialId]) {
      try {
        const rows = await materialHistory(materialId);
        setHistory((h) => ({ ...h, [materialId]: rows }));
      } catch {
        setHistory((h) => ({ ...h, [materialId]: [] }));
      }
    }
  }

  return (
    <div className="space-y-5">
      {canManage && (
        <div className="flex flex-wrap items-end gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1.5 block text-[12px] font-bold text-[var(--text)]">Material / task</label>
            <input className={`${FIELD} w-full`} value={name} placeholder="e.g. Stage banner"
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="w-[90px]">
            <label className="mb-1.5 block text-[12px] font-bold text-[var(--text)]">Qty</label>
            <input className={`${FIELD} w-full`} value={quantity} inputMode="numeric"
              onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ""))} />
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-[12px] font-bold text-[var(--text)]">Assign to</label>
            <Select
              value={assignedTo}
              onChange={setAssignedTo}
              placeholder="Unassigned"
              aria-label="Assign to"
              options={[
                { value: "", label: "Unassigned" },
                ...crew.map((c) => ({
                  value: c.userId,
                  label: c.fullName ?? c.email ?? "Unknown",
                  hint: c.eventRole === "MANAGER" ? "Sub-admin" : "Handler",
                })),
              ]}
            />
          </div>
          <Button size="sm" disabled={busy || !name.trim()} onClick={add}>Add material</Button>
        </div>
      )}
      {error && <p role="alert" className="text-[13px] font-semibold text-[var(--danger)]">{error}</p>}

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              <th className="px-4 py-3">Material</th><th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Assignee</th><th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Advance</th><th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">No materials yet.</td></tr>
            )}
            {materials.map((m) => (
              <tr key={m.id} className="border-b border-[var(--border)] last:border-0 align-top">
                <td className="px-4 py-3 text-[13px] font-semibold text-[var(--text)]">{m.name}</td>
                <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">{m.quantity ?? "—"}</td>
                <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">{m.assignedToName ?? "—"}</td>
                <td className="px-4 py-3"><MaterialStatusBadge status={m.status} /></td>
                <td className="px-4 py-3">
                  <Select
                    className="min-w-[9rem]"
                    value={m.status}
                    onChange={(v) => setStatus(m.id, v as MaterialStatus)}
                    aria-label="Status"
                    options={MATERIAL_STATUSES.map((s) => ({ value: s, label: materialStatusLabel(s) }))}
                  />
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Button variant="ghost" size="sm" onClick={() => toggleHistory(m.id)}>History</Button>
                  {canManage && <Button variant="ghost" size="sm" onClick={() => remove(m.id)}>Delete</Button>}
                  {openHistory === m.id && (
                    <div className="mt-2 max-w-[320px] space-y-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left">
                      {(history[m.id] ?? []).length === 0 && (
                        <p className="text-[12px] text-[var(--text-muted)]">No history.</p>
                      )}
                      {(history[m.id] ?? []).map((h) => (
                        <p key={h.id} className="text-[12px] text-[var(--text-muted)]">
                          <span className="font-semibold text-[var(--text)]">
                            {h.fromStatus ? `${materialStatusLabel(h.fromStatus)} → ` : ""}{materialStatusLabel(h.toStatus)}
                          </span>
                          {h.changedByName ? ` · ${h.changedByName}` : ""}{h.note ? ` · ${h.note}` : ""}
                        </p>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
