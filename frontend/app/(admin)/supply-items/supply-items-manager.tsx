"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupplyItem, deleteSupplyItem } from "@/lib/api/materials";
import { ApiError } from "@/lib/api/client";
import type { SupplyItemResponse } from "@/lib/api/types";
import { Button } from "@/components/ui/button";

const FIELD =
  "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]";

/**
 * Main supply catalog manager (docs/03 §4.6). Admin-only mutation; a referenced item cannot be
 * deleted (the server returns a clean 409, surfaced inline). Non-admins see a read-only table.
 */
export function SupplyItemsManager({
  items,
  canEdit,
}: {
  items: SupplyItemResponse[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [qty, setQty] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createSupplyItem({
        name: name.trim(),
        unit: unit.trim() || undefined,
        defaultQuantity: qty ? Number(qty) : undefined,
      });
      setName("");
      setUnit("");
      setQty("");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not add supply item.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await deleteSupplyItem(id);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not delete supply item.");
    }
  }

  return (
    <div className="space-y-5">
      {canEdit && (
        <div className="flex flex-wrap items-end gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1.5 block text-[12px] font-bold text-[var(--text)]">Item name</label>
            <input className={`${FIELD} w-full`} value={name} placeholder="e.g. Folding chairs"
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="w-[110px]">
            <label className="mb-1.5 block text-[12px] font-bold text-[var(--text)]">Unit</label>
            <input className={`${FIELD} w-full`} value={unit} placeholder="pcs"
              onChange={(e) => setUnit(e.target.value)} />
          </div>
          <div className="w-[110px]">
            <label className="mb-1.5 block text-[12px] font-bold text-[var(--text)]">Default qty</label>
            <input className={`${FIELD} w-full`} value={qty} inputMode="numeric"
              onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))} />
          </div>
          <Button size="sm" disabled={busy || !name.trim()} onClick={add}>Add item</Button>
        </div>
      )}
      {error && <p role="alert" className="text-[13px] font-semibold text-[var(--danger)]">{error}</p>}

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              <th className="px-4 py-3">Item</th><th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Default qty</th><th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[13px] text-[var(--text-muted)]">No supply items yet.</td></tr>
            )}
            {items.map((i) => (
              <tr key={i.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 text-[13px] font-semibold text-[var(--text)]">{i.name}</td>
                <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">{i.unit ?? "—"}</td>
                <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">{i.defaultQuantity ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  {canEdit && <Button variant="ghost" size="sm" onClick={() => remove(i.id)}>Delete</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
