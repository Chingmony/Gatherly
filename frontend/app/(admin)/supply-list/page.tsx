"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, MoreHorizontal, Search, Trash2, Edit2, Package, Loader2, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import {
  listSupplyItems, createSupplyItem, updateSupplyItem, deleteSupplyItem,
  type SupplyItem, type SupplyItemWriteBody,
} from "@/lib/api/supply";

interface ItemForm {
  name: string;
  description: string;
  unit: string;
  defaultQuantity: string;
  active: boolean;
}

const EMPTY_FORM: ItemForm = { name: "", description: "", unit: "", defaultQuantity: "", active: true };

export default function SupplyListPage() {
  const [items, setItems]     = useState<SupplyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<SupplyItem | null>(null);
  const [form, setForm]             = useState<ItemForm>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  const [confirmTarget, setConfirmTarget] = useState<SupplyItem | null>(null);

  const reload = useCallback(
    (signal?: AbortSignal) =>
      listSupplyItems()
        .then((data) => setItems(data))
        .catch((e) => { if (!signal?.aborted) setError(e instanceof ApiError ? e.message : "Failed to load supply items."); }),
    []
  );

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    reload(ctrl.signal).finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [reload]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(item: SupplyItem) {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      unit: item.unit ?? "",
      defaultQuantity: item.defaultQuantity != null ? String(item.defaultQuantity) : "",
      active: item.active,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    const body: SupplyItemWriteBody = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      unit: form.unit.trim() || null,
      defaultQuantity: form.defaultQuantity.trim() === "" ? null : Number(form.defaultQuantity),
      active: form.active,
    };
    try {
      if (editing) {
        await updateSupplyItem(editing.id, body);
        toast.success("Item updated");
      } else {
        await createSupplyItem(body);
        toast.success("Item added");
      }
      await reload();
      setDialogOpen(false);
    } catch (e) {
      toast.error(editing ? "Couldn't update item" : "Couldn't add item", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const item = confirmTarget;
    if (!item) return;
    try {
      await deleteSupplyItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Item deleted");
    } catch (e) {
      // 409 CONFLICT when the item is still referenced by event materials.
      const msg = e instanceof ApiError
        ? (e.status === 409 ? "This item is still used by event materials and can't be deleted." : e.message)
        : undefined;
      toast.error("Couldn't delete item", msg);
    }
  }

  const filtered = items.filter((it) =>
    it.name.toLowerCase().includes(search.toLowerCase()) ||
    (it.unit ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = items.filter((i) => i.active).length;
  const inactiveCount = items.length - activeCount;
  const canSubmit = form.name.trim().length > 0 && !saving;

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Supply List" sub="Manage the global supply catalog">
        <Button size="sm" onClick={openAdd}><Plus size={14} /> Add item</Button>
      </PageHeader>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--border-hex,#ecedf4)" }}>
          <StatusBadge variant="green">Active</StatusBadge>
          <span className="text-xs font-bold" style={{ color: "var(--text-strong)" }}>{activeCount}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--border-hex,#ecedf4)" }}>
          <StatusBadge variant="gray">Inactive</StatusBadge>
          <span className="text-xs font-bold" style={{ color: "var(--text-strong)" }}>{inactiveCount}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--border-hex,#ecedf4)" }}>
          <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>Total</span>
          <span className="text-xs font-bold" style={{ color: "var(--text-strong)" }}>{items.length}</span>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
        <input type="search" placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full h-[38px] pl-9 pr-3.5 rounded-[var(--radius-md)] border text-sm font-semibold transition-all focus:outline-none focus:border-[var(--primary-hex,#6366f1)]"
          style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }} />
      </div>

      {error ? (
        <Card><CardContent className="p-10 text-center text-sm font-semibold" style={{ color: "var(--danger)" }}>{error}</CardContent></Card>
      ) : loading ? (
        <Card><CardContent className="p-16 flex items-center justify-center" style={{ color: "var(--text-muted)" }}><Loader2 size={22} className="animate-spin" /></CardContent></Card>
      ) : (
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-hex,#ecedf4)" }}>
                  {["Item", "Unit", "Default qty", "Status", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3.5" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>{items.length === 0 ? "No supply items yet." : "No items match your search."}</td></tr>
                ) : filtered.map((item, i) => (
                  <tr key={item.id} className="transition-colors hover:bg-[var(--surface-2)]" style={{ borderBottom: i === filtered.length - 1 ? "none" : "1px solid var(--border-hex,#ecedf4)" }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary-soft)" }}>
                          <Package size={14} style={{ color: "var(--primary-hex,#6366f1)" }} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold" style={{ color: "var(--text-strong)" }}>{item.name}</span>
                          {item.description && <span className="text-xs truncate max-w-[280px]" style={{ color: "var(--text-muted)" }}>{item.description}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-muted)" }}>{item.unit || "—"}</td>
                    <td className="px-5 py-3.5 font-bold text-sm" style={{ color: "var(--text-strong)" }}>{item.defaultQuantity ?? "—"}</td>
                    <td className="px-5 py-3.5"><StatusBadge variant={item.active ? "green" : "gray"}>{item.active ? "Active" : "Inactive"}</StatusBadge></td>
                    <td className="px-5 py-3.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal size={15} /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openEdit(item)}><Edit2 size={13} /> Edit item</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-[var(--danger)]" onSelect={() => setConfirmTarget(item)}><Trash2 size={13} /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit supply item" : "Add supply item"}</DialogTitle>
            <DialogDescription>A reusable item in the global supply catalog.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-name">Item name <span style={{ color: "var(--danger)" }}>*</span></Label>
              <Input id="item-name" autoFocus maxLength={200} placeholder="e.g. Folding chairs" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-desc">Description</Label>
              <Input id="item-desc" maxLength={2000} placeholder="Optional details" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-unit">Unit</Label>
                <Input id="item-unit" maxLength={50} placeholder="e.g. pcs, boxes" value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-qty">Default quantity</Label>
                <Input id="item-qty" type="number" min="0" placeholder="0" value={form.defaultQuantity} onChange={(e) => setForm((p) => ({ ...p, defaultQuantity: e.target.value }))} />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>Active</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>— available to assign on event materials</span>
            </label>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={saving}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={!canSubmit}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : editing ? <Check size={14} /> : <Plus size={14} />}
                {editing ? "Save changes" : "Add item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmTarget != null}
        onOpenChange={(v) => { if (!v) setConfirmTarget(null); }}
        title="Delete supply item?"
        description={confirmTarget ? `"${confirmTarget.name}" will be removed from the catalog.` : undefined}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
