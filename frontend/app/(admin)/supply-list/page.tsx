"use client";

import { useState } from "react";
import { Plus, Search, Trash2, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

type SupplyStatus = "in-stock" | "low" | "out-of-stock";

type SupplyItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  onHand: number;
  status: SupplyStatus;
};

const ITEMS: SupplyItem[] = [
  { id: "s1", sku: "FUR-0420", name: "Folding Chairs",       category: "Furniture",    unit: "each", onHand: 480,  status: "in-stock" },
  { id: "s2", sku: "FUR-0610", name: "Round Tables (6ft)",   category: "Furniture",    unit: "each", onHand: 58,   status: "low" },
  { id: "s3", sku: "PRN-1100", name: "Lanyards + Badges",    category: "Print",        unit: "pack", onHand: 2000, status: "in-stock" },
  { id: "s4", sku: "AV-0312",  name: "Wireless Microphones", category: "AV",           unit: "unit", onHand: 12,   status: "low" },
  { id: "s5", sku: "AV-0440",  name: "LED Uplights",         category: "AV",           unit: "unit", onHand: 40,   status: "in-stock" },
];

const STATUS_VARIANT: Record<SupplyStatus, "green" | "orange" | "danger"> = { "in-stock": "green", low: "orange", "out-of-stock": "danger" };
const STATUS_LABEL: Record<SupplyStatus, string> = { "in-stock": "In stock", low: "Low stock", "out-of-stock": "Out of stock" };

const CATEGORY_VARIANT: Record<string, "blue" | "violet" | "teal" | "orange" | "pink" | "gray"> = {
  Furniture: "blue",
  Print: "violet",
  Registration: "violet",
  AV: "teal",
  "A/V": "teal",
  Catering: "orange",
  Electrical: "pink",
};
const CATEGORIES = ["Furniture", "Print", "AV", "Catering", "Electrical", "Other"];
const UNITS = ["each", "pack", "unit", "box", "set"];

function categoryVariant(c: string) {
  return CATEGORY_VARIANT[c] ?? "gray";
}

export default function SupplyListPage() {
  const [search, setSearch]   = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm]       = useState({ sku: "", name: "", category: CATEGORIES[0], unit: UNITS[0], onHand: "" });

  const filtered = ITEMS.filter((it) => {
    const q = search.toLowerCase();
    return (
      it.name.toLowerCase().includes(q) ||
      it.sku.toLowerCase().includes(q) ||
      it.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Supply List" sub="Track and manage event supplies">
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus size={14} /> Add item</Button>
      </PageHeader>

      <div className="flex items-center gap-3 flex-wrap">
        {(["in-stock", "low", "out-of-stock"] as SupplyStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--border-hex,#ecedf4)" }}>
            <StatusBadge variant={STATUS_VARIANT[s]} dot>{STATUS_LABEL[s]}</StatusBadge>
            <span className="text-xs font-bold" style={{ color: "var(--text-strong)" }}>{ITEMS.filter((i) => i.status === s).length}</span>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" style={{ color: "var(--text-faint)" }} />
        <Input type="search" placeholder="Search items, SKU…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-hex,#ecedf4)" }}>
                  {["ID", "Item", "Category", "Unit", "On hand", "Status"].map((h) => (
                    <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3.5" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                  <th className="text-right text-xs font-bold uppercase tracking-wider px-5 py-3.5" style={{ color: "var(--text-muted)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={item.id} className="transition-colors hover:bg-[var(--surface-2)]" style={{ borderBottom: i === filtered.length - 1 ? "none" : "1px solid var(--border-hex,#ecedf4)" }}>
                    <td className="px-5 py-3.5 font-mono text-xs tracking-wide" style={{ color: "var(--text-faint)" }}>{item.sku}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary-soft)" }}>
                          <ShoppingCart size={14} style={{ color: "var(--primary-hex,#6366f1)" }} />
                        </div>
                        <span className="font-bold" style={{ color: "var(--text-strong)" }}>{item.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge variant={categoryVariant(item.category)}>{item.category}</StatusBadge></td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-muted)" }}>{item.unit}</td>
                    <td className="px-5 py-3.5 font-bold text-sm tabular-nums" style={{ color: item.onHand === 0 ? "var(--danger)" : "var(--text-strong)" }}>{item.onHand.toLocaleString()}</td>
                    <td className="px-5 py-3.5"><StatusBadge variant={STATUS_VARIANT[item.status]} dot>{STATUS_LABEL[item.status]}</StatusBadge></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="danger" size="icon-sm" aria-label={`Delete ${item.name}`}><Trash2 size={15} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                      No items match “{search}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add supply item</DialogTitle>
            <DialogDescription>Track a new item in the supply catalog.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-sku">SKU ID</Label>
                <Input id="item-sku" placeholder="e.g. FUR-0420" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-name">Item name</Label>
                <Input id="item-name" placeholder="e.g. Folding Chairs" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-category">Category</Label>
                <select id="item-category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="h-[42px] px-3 rounded-[var(--radius-md)] border text-sm font-semibold focus:outline-none"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-unit">Unit</Label>
                <select id="item-unit" value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                  className="h-[42px] px-3 rounded-[var(--radius-md)] border text-sm font-semibold focus:outline-none"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-onhand">On hand</Label>
                <Input id="item-onhand" type="number" min="0" placeholder="0" value={form.onHand} onChange={(e) => setForm((p) => ({ ...p, onHand: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => setAddOpen(false)}><Plus size={14} /> Add item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
