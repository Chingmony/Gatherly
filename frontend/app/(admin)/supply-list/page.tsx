"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, Search, Trash2, Edit2, Package } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type SupplyStatus = "available" | "low" | "out-of-stock" | "ordered";

const ITEMS = [
  { id: "s1", name: "Folding chairs",         category: "Furniture",    qty: 200, status: "available" as SupplyStatus,    event: "NorthStar Leadership Summit" },
  { id: "s2", name: "Name badge holders",     category: "Registration", qty: 500, status: "available" as SupplyStatus,    event: "All events" },
  { id: "s3", name: "Wireless lapel mics",    category: "A/V",          qty: 4,   status: "low" as SupplyStatus,          event: "Lumen Design Festival" },
  { id: "s4", name: "Extension cords (6ft)",  category: "Electrical",   qty: 0,   status: "out-of-stock" as SupplyStatus, event: "DevConnect Winter" },
  { id: "s5", name: "Catering trays (large)", category: "Catering",     qty: 50,  status: "ordered" as SupplyStatus,      event: "Founders Circle — Q3" },
  { id: "s6", name: "Branded lanyards",       category: "Registration", qty: 820, status: "available" as SupplyStatus,    event: "All events" },
];

const STATUS_VARIANT: Record<SupplyStatus, "green" | "orange" | "danger" | "blue"> = { available: "green", low: "orange", "out-of-stock": "danger", ordered: "blue" };
const STATUS_LABEL: Record<SupplyStatus, string> = { available: "Available", low: "Low stock", "out-of-stock": "Out of stock", ordered: "Ordered" };
const CATEGORIES = ["Furniture", "Registration", "A/V", "Electrical", "Catering", "Other"];

export default function SupplyListPage() {
  const [search, setSearch]   = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm]       = useState({ name: "", category: CATEGORIES[0], qty: "", status: "available" as SupplyStatus, event: "" });

  const filtered = ITEMS.filter((it) =>
    it.name.toLowerCase().includes(search.toLowerCase()) ||
    it.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Supply List" sub="Track and manage event supplies">
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus size={14} /> Add item</Button>
      </PageHeader>

      <div className="flex items-center gap-3 flex-wrap">
        {(["available", "low", "out-of-stock", "ordered"] as SupplyStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--border-hex,#ecedf4)" }}>
            <StatusBadge variant={STATUS_VARIANT[s]}>{STATUS_LABEL[s]}</StatusBadge>
            <span className="text-xs font-bold" style={{ color: "var(--text-strong)" }}>{ITEMS.filter((i) => i.status === s).length}</span>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
        <input type="search" placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full h-[38px] pl-9 pr-3.5 rounded-[var(--radius-md)] border text-sm font-semibold transition-all focus:outline-none focus:border-[var(--primary-hex,#6366f1)]"
          style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-hex,#ecedf4)" }}>
                  {["Item", "Category", "Qty", "Status", "Event", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3.5" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={item.id} className="transition-colors hover:bg-[var(--surface-2)]" style={{ borderBottom: i === filtered.length - 1 ? "none" : "1px solid var(--border-hex,#ecedf4)" }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary-soft)" }}>
                          <Package size={14} style={{ color: "var(--primary-hex,#6366f1)" }} />
                        </div>
                        <span className="font-bold" style={{ color: "var(--text-strong)" }}>{item.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-muted)" }}>{item.category}</td>
                    <td className="px-5 py-3.5 font-bold text-sm" style={{ color: item.qty === 0 ? "var(--danger)" : "var(--text-strong)" }}>{item.qty}</td>
                    <td className="px-5 py-3.5"><StatusBadge variant={STATUS_VARIANT[item.status]}>{STATUS_LABEL[item.status]}</StatusBadge></td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-muted)" }}>{item.event}</td>
                    <td className="px-5 py-3.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal size={15} /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Edit2 size={13} /> Edit item</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-[var(--danger)]"><Trash2 size={13} /> Delete</DropdownMenuItem>
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add supply item</DialogTitle>
            <DialogDescription>Track a new item in the supply catalog.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="item-name">Item name</Label>
              <Input id="item-name" placeholder="e.g. Folding chairs" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="h-[42px] px-3 rounded-[var(--radius-md)] border text-sm font-semibold focus:outline-none"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="item-qty">Quantity</Label>
                <Input id="item-qty" type="number" min="0" placeholder="0" value={form.qty} onChange={(e) => setForm((p) => ({ ...p, qty: e.target.value }))} />
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
