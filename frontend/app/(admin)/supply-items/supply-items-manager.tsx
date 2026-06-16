"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { createSupplyItem, deleteSupplyItem, updateSupplyItem } from "@/lib/api/materials";
import { ApiError } from "@/lib/api/client";
import {
  SUPPLY_CATEGORY_LABEL,
  SUPPLY_STATUS_LABEL,
  type SupplyCategory,
  type SupplyItemBody,
  type SupplyItemResponse,
  type SupplyStatus,
} from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";

const CATEGORIES: SupplyCategory[] = [
  "FURNITURE", "PRINT", "AV", "STAGING", "CATERING", "COMMS",
];

const CATEGORY_VARIANT: Record<SupplyCategory, BadgeProps["variant"]> = {
  FURNITURE: "blue",
  PRINT: "violet",
  AV: "teal",
  STAGING: "orange",
  CATERING: "green",
  COMMS: "gray",
  OTHER: "gray",
};

const STATUS_VARIANT: Record<SupplyStatus, BadgeProps["variant"]> = {
  IN_STOCK: "green",
  LOW_STOCK: "orange",
  OUT_OF_STOCK: "danger",
};

/** Sort order for "Status" — most-urgent first, so low/out-of-stock surfaces at the top. */
const STATUS_ORDER: Record<SupplyStatus, number> = {
  OUT_OF_STOCK: 0,
  LOW_STOCK: 1,
  IN_STOCK: 2,
};

type SupplySort = "name" | "onhand-desc" | "onhand-asc" | "status";
const SUPPLY_SORTS: { value: SupplySort; label: string }[] = [
  { value: "name", label: "Name: A–Z" },
  { value: "onhand-desc", label: "On hand: high → low" },
  { value: "onhand-asc", label: "On hand: low → high" },
  { value: "status", label: "Status: urgent first" },
];

type Editing = SupplyItemResponse | "new" | null;

/**
 * Supply Catalog manager (docs/03 §4.6). Admin-only mutation; non-admins get a read-only catalog
 * with no Add/Edit/Delete affordances and no Actions column. A referenced item cannot be deleted
 * (the server returns a clean 409, surfaced inline). Stock status is derived server-side.
 */
export function SupplyItemsManager({
  items,
  canEdit,
}: {
  items: SupplyItemResponse[];
  canEdit: boolean;
}) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<SupplyCategory | "ALL">("ALL");
  const [sort, setSort] = useState<SupplySort>("name");
  const [editing, setEditing] = useState<Editing>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((i) => {
      if (activeCat !== "ALL" && i.category !== activeCat) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) || (i.sku?.toLowerCase().includes(q) ?? false)
      );
    });
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "onhand-desc": return b.onHand - a.onHand;
        case "onhand-asc": return a.onHand - b.onHand;
        case "status": return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        case "name":
        default: return a.name.localeCompare(b.name);
      }
    });
  }, [items, query, activeCat, sort]);

  async function remove(item: SupplyItemResponse) {
    setError(null);
    try {
      await deleteSupplyItem(item.id);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not delete supply item.");
    }
  }

  return (
    <div className="view-anim space-y-6">
      {/* Header: title + search + Add Item (image header row) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-[var(--text-strong)]">
            Supply Catalog
          </h1>
          <p className="mt-1 text-[13.5px] text-[var(--text-muted)]">
            Master inventory — assign these items to individual events
            {canEdit ? "" : " · Read-only"}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-faint)]"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items / SKU…"
              aria-label="Search supply items"
              className="w-[230px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-[13px] text-[var(--text)] shadow-[var(--shadow-sm)] placeholder:text-[var(--text-faint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            />
          </div>
          <Select
            value={sort}
            onChange={(v) => setSort(v as SupplySort)}
            aria-label="Sort items"
            className="w-auto min-w-[11rem]"
            options={SUPPLY_SORTS}
          />
          {canEdit && (
            <Button onClick={() => { setError(null); setEditing("new"); }}>
              <Plus className="size-4" /> Add Item
            </Button>
          )}
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        <Tab label="All Categories" active={activeCat === "ALL"} onClick={() => setActiveCat("ALL")} />
        {CATEGORIES.map((c) => (
          <Tab
            key={c}
            label={SUPPLY_CATEGORY_LABEL[c]}
            active={activeCat === c}
            onClick={() => setActiveCat(c)}
          />
        ))}
      </div>

      {error && (
        <p role="alert" className="text-[13px] font-semibold text-[var(--danger)]">{error}</p>
      )}

      {/* Catalog table */}
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              <th className="px-5 py-3.5">SKU ID</th>
              <th className="px-5 py-3.5">Item</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Unit</th>
              <th className="px-5 py-3.5">On hand</th>
              <th className="px-5 py-3.5">Status</th>
              {canEdit && <th className="px-5 py-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="px-5 py-12 text-center text-[13px] text-[var(--text-muted)]">
                  {items.length === 0 ? "No supply items yet." : "No items match your filters."}
                </td>
              </tr>
            )}
            {visible.map((i) => (
              <tr
                key={i.id}
                className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--surface-2)]"
              >
                <td className="px-5 py-3.5 text-[12.5px] tracking-wide text-[var(--text-faint)]"
                    style={{ fontFamily: "var(--mono)" }}>
                  {i.sku ?? "—"}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--primary-soft)] text-[var(--primary)]">
                      <ShoppingCart aria-hidden className="size-[18px]" />
                    </span>
                    <span className="text-[13.5px] font-bold text-[var(--text-strong)]">{i.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  {i.category ? (
                    <Badge variant={CATEGORY_VARIANT[i.category]} dot={false}>
                      {SUPPLY_CATEGORY_LABEL[i.category]}
                    </Badge>
                  ) : (
                    <span className="text-[13px] text-[var(--text-faint)]">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-[13px] text-[var(--text-muted)]">{i.unit ?? "—"}</td>
                <td className="px-5 py-3.5 text-[14px] font-extrabold text-[var(--text-strong)]">
                  {i.onHand.toLocaleString()}
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={STATUS_VARIANT[i.status]}>{SUPPLY_STATUS_LABEL[i.status]}</Badge>
                </td>
                {canEdit && (
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setError(null); setEditing(i); }}>
                        Edit
                      </Button>
                      <button
                        type="button"
                        aria-label={`Delete ${i.name}`}
                        onClick={() => remove(i)}
                        className="grid size-8 place-items-center rounded-[var(--radius-sm)] bg-[var(--danger-soft)] text-[var(--danger)] transition-colors hover:bg-[var(--danger)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]"
                      >
                        <Trash2 aria-hidden className="size-[15px]" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canEdit && editing && (
        <ItemDialog
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
        active
          ? "bg-[var(--primary-soft)] text-[var(--primary)]"
          : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
      }`}
    >
      {label}
    </button>
  );
}

const FIELD =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-[14px] text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]";

/** Add / Edit modal — Admin only (the parent gates rendering on `canEdit`). */
function ItemDialog({
  item,
  onClose,
  onSaved,
}: {
  item: SupplyItemResponse | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = item !== null;
  const [name, setName] = useState(item?.name ?? "");
  const [sku, setSku] = useState(item?.sku ?? "");
  const [category, setCategory] = useState<SupplyCategory | "">(item?.category ?? "");
  const [unit, setUnit] = useState(item?.unit ?? "");
  const [onHand, setOnHand] = useState(item ? String(item.onHand) : "");
  const [threshold, setThreshold] = useState(
    item?.lowStockThreshold != null ? String(item.lowStockThreshold) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    const body: SupplyItemBody = {
      name: name.trim(),
      sku: sku.trim() || undefined,
      category: category || undefined,
      unit: unit.trim() || undefined,
      onHand: onHand ? Number(onHand) : 0,
      lowStockThreshold: threshold ? Number(threshold) : undefined,
    };
    try {
      if (isEdit) await updateSupplyItem(item.id, body);
      else await createSupplyItem(body);
      onSaved();
    } catch (e2) {
      setError(e2 instanceof ApiError ? e2.message : "Could not save supply item.");
      setBusy(false);
    }
  }

  return (
    <Dialog open onClose={onClose} titleId="supply-item-title">
      <h2 id="supply-item-title" className="text-[16px] font-extrabold tracking-[-0.01em] text-[var(--text-strong)]">
        {isEdit ? "Edit item" : "Add item"}
      </h2>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <Label htmlFor="si-name">Item name</Label>
          <input id="si-name" className={FIELD} value={name} placeholder="e.g. Folding Chairs"
                 onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="si-sku">SKU ID</Label>
            <input id="si-sku" className={FIELD} value={sku} placeholder="FUR-0420"
                   onChange={(e) => setSku(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="si-cat">Category</Label>
            <Select id="si-cat" value={category}
              onChange={(v) => setCategory(v as SupplyCategory | "")}
              placeholder="Uncategorized"
              options={[
                { value: "", label: "Uncategorized" },
                ...CATEGORIES.map((c) => ({ value: c, label: SUPPLY_CATEGORY_LABEL[c] })),
              ]} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="si-unit">Unit</Label>
            <input id="si-unit" className={FIELD} value={unit} placeholder="each"
                   onChange={(e) => setUnit(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="si-onhand">On hand</Label>
            <input id="si-onhand" className={FIELD} value={onHand} inputMode="numeric" placeholder="0"
                   onChange={(e) => setOnHand(e.target.value.replace(/[^0-9]/g, ""))} />
          </div>
          <div>
            <Label htmlFor="si-thresh">Low at</Label>
            <input id="si-thresh" className={FIELD} value={threshold} inputMode="numeric" placeholder="—"
                   onChange={(e) => setThreshold(e.target.value.replace(/[^0-9]/g, ""))} />
          </div>
        </div>
        {error && <p role="alert" className="text-[13px] font-semibold text-[var(--danger)]">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || !name.trim()}>
            {busy ? "Saving…" : isEdit ? "Save changes" : "Add item"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
