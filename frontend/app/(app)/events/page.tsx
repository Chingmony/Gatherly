import Link from "next/link";
import { Plus, Eye, Trash2, Search, Filter } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Events" };

const EVENTS = [
  { id: "ev1", name: "NorthStar Leadership Summit", status: "live",      date: "Jun 18, 2026", location: "San Francisco, CA",   registered: 842,  capacity: 1000, fillPct: 84, cover: "#6366f1" },
  { id: "ev2", name: "Lumen Design Festival",       status: "published", date: "Jul 4, 2026",  location: "New York, NY",        registered: 5984, capacity: 8000, fillPct: 75, cover: "#8b5cf6" },
  { id: "ev3", name: "DevConnect Winter",           status: "draft",     date: "Aug 22, 2026", location: "Austin, TX",          registered: 0,    capacity: 500,  fillPct: 0,  cover: "#14b8a6" },
  { id: "ev4", name: "Founders Circle — Q3",        status: "published", date: "Sep 10, 2026", location: "Chicago, IL",         registered: 210,  capacity: 300,  fillPct: 70, cover: "#ec4899" },
  { id: "ev5", name: "Horizon Product Summit",      status: "ended",     date: "May 2, 2026",  location: "Los Angeles, CA",     registered: 1200, capacity: 1200, fillPct: 100,cover: "#f59e0b" },
];

const STATUS_VARIANTS: Record<string, { label: string; variant: "green" | "blue" | "gray" | "orange" | "danger" | "primary" }> = {
  live:      { label: "Live",      variant: "primary" },
  published: { label: "Published", variant: "green" },
  draft:     { label: "Draft",     variant: "gray" },
  ended:     { label: "Ended",     variant: "orange" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

export default function AllEventsPage() {
  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Events" sub="Plan, publish and track every event">
        <Button asChild size="sm">
          <Link href="/events/new"><Plus size={15} /> New event</Link>
        </Button>
      </PageHeader>

      {/* Search / filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
          <input
            type="search"
            placeholder="Search events…"
            className="w-full h-[38px] pl-9 pr-3.5 rounded-[var(--radius-md)] border text-sm font-semibold transition-all focus:outline-none focus:border-[var(--primary-hex,#6366f1)] focus:shadow-[0_0_0_4px_var(--primary-ring)]"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-hex, #ecedf4)",
              color: "var(--text)",
            }}
          />
        </div>
        <Button variant="ghost" size="sm"><Filter size={14} /> Filter</Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-hex, #ecedf4)" }}>
                  {["Event", "Status", "Fill rate", "Date", "Location", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EVENTS.map((ev, i) => {
                  const st = STATUS_VARIANTS[ev.status] ?? { label: ev.status, variant: "gray" as const };
                  const isLast = i === EVENTS.length - 1;
                  return (
                    <tr
                      key={ev.id}
                      className="transition-colors hover:bg-[var(--surface-2)]"
                      style={{ borderBottom: isLast ? "none" : "1px solid var(--border-hex, #ecedf4)" }}
                    >
                      {/* Event name + cover color */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-[var(--radius-sm)] flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${ev.cover}, color-mix(in srgb, ${ev.cover} 60%, #22c55e))` }}
                          />
                          <span className="font-bold" style={{ color: "var(--text-strong)" }}>
                            {ev.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge variant={st.variant}>{st.label}</StatusBadge>
                      </td>
                      <td className="px-5 py-4 min-w-[140px]">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-xs">
                            <span style={{ color: "var(--text-muted)" }}>
                              {ev.registered.toLocaleString()} / {ev.capacity.toLocaleString()}
                            </span>
                            <span className="font-bold" style={{ color: "var(--text-strong)" }}>{ev.fillPct}%</span>
                          </div>
                          <Progress value={ev.fillPct} />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {ev.date}
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
                        {ev.location}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Button asChild variant="ghost" size="icon-sm" title="Open workspace">
                            <Link href={`/events/${ev.id}/workspace`}><Eye size={15} /></Link>
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]" title="Delete event">
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
