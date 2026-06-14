"use client";

import { useState, useEffect } from "react";
import {
  Users, Calendar, QrCode, CheckSquare,
  TrendingUp, AlertTriangle, Clock, Zap,
  ArrowRight, ScanLine,
} from "lucide-react";
import Link from "next/link";
import { StatTile } from "@/components/ui/stat-tile";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChipIco } from "@/components/ui/chip-ico";
import type { Role } from "@/lib/roles";

const EVENTS = [
  { id: "ev1", name: "NorthStar Leadership Summit", status: "live",      date: "Jun 18, 2026", registered: 842,  capacity: 1000, fillPct: 84 },
  { id: "ev2", name: "Lumen Design Festival",       status: "published", date: "Jul 4, 2026",  registered: 5984, capacity: 8000, fillPct: 75 },
  { id: "ev3", name: "DevConnect Winter",           status: "draft",     date: "Aug 22, 2026", registered: 0,    capacity: 500,  fillPct: 0  },
  { id: "ev4", name: "Founders Circle — Q3",        status: "published", date: "Sep 10, 2026", registered: 210,  capacity: 300,  fillPct: 70 },
];

const STATUS_VARIANTS: Record<string, { label: string; variant: "green" | "blue" | "gray" | "orange" | "primary" }> = {
  live:      { label: "Live",      variant: "primary" },
  published: { label: "Published", variant: "green" },
  draft:     { label: "Draft",     variant: "gray" },
  ended:     { label: "Ended",     variant: "orange" },
};

const ISSUES = [
  { icon: AlertTriangle, title: "Wi-Fi QA sweep flagged",     body: "Liam Carter — NorthStar Summit", when: "12m ago", bg: "var(--danger-soft)",  color: "var(--danger)" },
  { icon: Clock,         title: "3 tasks overdue",            body: "DevConnect check-in setup",     when: "1h ago",  bg: "var(--orange-soft)", color: "var(--orange)" },
  { icon: Zap,           title: "High registration velocity", body: "Lumen Festival +320 in 2h",    when: "2h ago",  bg: "var(--blue-soft)",   color: "var(--blue)" },
  { icon: TrendingUp,    title: "Capacity milestone hit",     body: "Founders Circle — 70% sold",   when: "3h ago",  bg: "var(--green-soft)",  color: "var(--green-600)" },
];

const MANAGER_TASKS = [
  { id: "t1", title: "Finalize event agenda",    event: "NorthStar Summit", status: "in-progress", due: "Jun 16" },
  { id: "t2", title: "Confirm A/V vendor",       event: "NorthStar Summit", status: "todo",        due: "Jun 17" },
  { id: "t3", title: "Review registration form", event: "Lumen Festival",   status: "done",        due: "Jun 12" },
  { id: "t4", title: "Assign scanner handlers",  event: "NorthStar Summit", status: "todo",        due: "Jun 17" },
];

const HANDLER_TASKS = [
  { id: "h1", title: "Set up check-in stations", event: "NorthStar Summit", status: "in-progress", due: "Jun 18" },
  { id: "h2", title: "Badge printer test",        event: "NorthStar Summit", status: "todo",        due: "Jun 17" },
  { id: "h3", title: "Verify QR scanner app",    event: "NorthStar Summit", status: "done",        due: "Jun 15" },
];

const TASK_VARIANT: Record<string, "blue" | "orange" | "green"> = { "in-progress": "blue", todo: "orange", done: "green" };
const TASK_LABEL:   Record<string, string>                       = { "in-progress": "In Progress", todo: "To Do", done: "Done" };

/* ── Admin: Command Center ── */
function AdminDashboard() {
  const STATS = [
    { label: "Total Registrations", value: "12,841", delta: "+8.4% this month",      trend: "up"      as const, icon: Users,       iconColor: "var(--primary-hex,#6366f1)", iconBg: "var(--primary-soft)" },
    { label: "Active Events",       value: "7",      delta: "3 going live this week", trend: "neutral" as const, icon: Calendar,    iconColor: "var(--blue)",                 iconBg: "var(--blue-soft)" },
    { label: "Check-ins Today",     value: "1,204",  delta: "+14% vs last event",     trend: "up"      as const, icon: QrCode,      iconColor: "var(--green-600)",            iconBg: "var(--green-soft)" },
    { label: "Open Tasks",          value: "38",     delta: "5 overdue",              trend: "down"    as const, icon: CheckSquare, iconColor: "var(--orange)",               iconBg: "var(--orange-soft)" },
  ];
  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="Command Center" sub="Real-time overview of all events and operations">
        <Button asChild size="sm"><Link href="/events/new"><Zap size={15} /> New event</Link></Button>
      </PageHeader>
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Global Pulse</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">{STATS.map((s) => <StatTile key={s.label} {...s} />)}</div>
      </section>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
        <Card>
          <CardHeader className="px-6 pt-6 pb-4">
            <CardTitle>Event Control Center</CardTitle>
            <div className="ml-auto flex gap-2">
              <Button asChild variant="ghost" size="sm"><Link href="/events">View all</Link></Button>
              <Button asChild size="sm"><Link href="/events/new">+ New</Link></Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-hex,#ecedf4)" }}>
                    {["Event", "Status", "Fill rate", "Date", ""].map((h) => (
                      <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EVENTS.map((ev) => {
                    const st = STATUS_VARIANTS[ev.status] ?? { label: ev.status, variant: "gray" as const };
                    return (
                      <tr key={ev.id} className="transition-colors hover:bg-[var(--surface-2)]" style={{ borderBottom: "1px solid var(--border-hex,#ecedf4)" }}>
                        <td className="px-5 py-4 font-bold text-sm" style={{ color: "var(--text-strong)" }}>{ev.name}</td>
                        <td className="px-5 py-4"><StatusBadge variant={st.variant}>{st.label}</StatusBadge></td>
                        <td className="px-5 py-4 min-w-[140px]">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span style={{ color: "var(--text-muted)" }}>{ev.registered.toLocaleString()} / {ev.capacity.toLocaleString()}</span>
                              <span className="font-bold" style={{ color: "var(--text-strong)" }}>{ev.fillPct}%</span>
                            </div>
                            <Progress value={ev.fillPct} />
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{ev.date}</td>
                        <td className="px-5 py-4">
                          <Button asChild variant="ghost" size="icon-sm">
                            <Link href={`/events/${ev.id}/workspace`}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="px-6 pt-6 pb-4"><CardTitle>Critical Attention</CardTitle></CardHeader>
          <CardContent className="px-4 pb-5 pt-0 flex flex-col gap-2">
            {ISSUES.map((issue, i) => {
              const Icon = issue.icon;
              return (
                <div key={i} className="flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors hover:bg-[var(--surface-2)]">
                  <ChipIco size={34} radius={9} className="flex-shrink-0" style={{ background: issue.bg, color: issue.color } as React.CSSProperties}><Icon size={16} /></ChipIco>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{issue.title}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{issue.body}</span>
                    <span className="text-[11px] mt-0.5" style={{ color: "var(--text-faint)" }}>{issue.when}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── Manager: Event Overview + Tasks ── */
function ManagerDashboard() {
  const myEvents = EVENTS.filter((e) => e.status === "live" || e.status === "published");
  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="My Events" sub="Overview of events you manage">
        <Button asChild size="sm"><Link href="/events/ev1/workspace">Open workspace <ArrowRight size={14} /></Link></Button>
      </PageHeader>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Assigned Events",  value: String(myEvents.length), icon: Calendar,    iconColor: "var(--blue)",           iconBg: "var(--blue-soft)",    delta: "Active",              trend: "neutral" as const },
          { label: "Total Registered", value: "6,826",                 icon: Users,       iconColor: "var(--primary-hex)",    iconBg: "var(--primary-soft)", delta: "+4.2% this week",     trend: "up"      as const },
          { label: "Open Tasks",       value: String(MANAGER_TASKS.filter((t) => t.status !== "done").length), icon: CheckSquare, iconColor: "var(--orange)", iconBg: "var(--orange-soft)", delta: "Across my events", trend: "neutral" as const },
          { label: "Next Check-in",    value: "Jun 18",                icon: QrCode,      iconColor: "var(--green-600)",      iconBg: "var(--green-soft)",   delta: "NorthStar Summit",    trend: "neutral" as const },
        ].map((s) => <StatTile key={s.label} {...s} />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        <Card>
          <CardHeader className="px-6 pt-6 pb-4">
            <CardTitle>My Events</CardTitle>
            <Button asChild variant="ghost" size="sm" className="ml-auto"><Link href="/events">View all</Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-hex,#ecedf4)" }}>
                    {["Event", "Status", "Fill rate", "Date", ""].map((h) => (
                      <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myEvents.map((ev, i) => {
                    const st = STATUS_VARIANTS[ev.status] ?? { label: ev.status, variant: "gray" as const };
                    return (
                      <tr key={ev.id} className="transition-colors hover:bg-[var(--surface-2)]" style={{ borderBottom: i < myEvents.length - 1 ? "1px solid var(--border-hex,#ecedf4)" : "none" }}>
                        <td className="px-5 py-4 font-bold text-sm" style={{ color: "var(--text-strong)" }}>{ev.name}</td>
                        <td className="px-5 py-4"><StatusBadge variant={st.variant}>{st.label}</StatusBadge></td>
                        <td className="px-5 py-4 min-w-[140px]">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span style={{ color: "var(--text-muted)" }}>{ev.registered.toLocaleString()} / {ev.capacity.toLocaleString()}</span>
                              <span className="font-bold" style={{ color: "var(--text-strong)" }}>{ev.fillPct}%</span>
                            </div>
                            <Progress value={ev.fillPct} />
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{ev.date}</td>
                        <td className="px-5 py-4">
                          <Button asChild variant="ghost" size="sm"><Link href={`/events/${ev.id}/workspace`}>Workspace</Link></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="px-6 pt-6 pb-4">
            <CardTitle>My Tasks</CardTitle>
            <Button asChild variant="ghost" size="sm" className="ml-auto"><Link href="/tasks">View all</Link></Button>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0 flex flex-col">
            {MANAGER_TASKS.map((t) => (
              <div key={t.id} className="flex items-start gap-3 py-3.5 border-b last:border-0" style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{t.title}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t.event}</span>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <StatusBadge variant={TASK_VARIANT[t.status]}>{TASK_LABEL[t.status]}</StatusBadge>
                  <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>Due {t.due}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── Handler: Tasks + Scanner CTA ── */
function HandlerDashboard() {
  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="My Dashboard" sub="Your tasks and scanner for today" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Tasks Pending",  value: String(HANDLER_TASKS.filter((t) => t.status !== "done").length), icon: CheckSquare, iconColor: "var(--orange)",    iconBg: "var(--orange-soft)", delta: "Needs action",     trend: "neutral" as const },
          { label: "Completed",      value: String(HANDLER_TASKS.filter((t) => t.status === "done").length), icon: CheckSquare, iconColor: "var(--green-600)", iconBg: "var(--green-soft)",  delta: "Today",            trend: "up"      as const },
          { label: "Check-ins Done", value: "842",                                                            icon: QrCode,      iconColor: "var(--blue)",      iconBg: "var(--blue-soft)",   delta: "NorthStar Summit", trend: "up"      as const },
          { label: "Assigned Event", value: "Jun 18",                                                         icon: Calendar,    iconColor: "var(--primary-hex,#6366f1)", iconBg: "var(--primary-soft)", delta: "NorthStar Summit", trend: "neutral" as const },
        ].map((s) => <StatTile key={s.label} {...s} />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        <Card>
          <CardHeader className="px-6 pt-6 pb-4">
            <CardTitle>My Tasks</CardTitle>
            <Button asChild variant="ghost" size="sm" className="ml-auto"><Link href="/tasks">View all</Link></Button>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0 flex flex-col">
            {HANDLER_TASKS.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3.5 border-b last:border-0" style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.status === "done" ? "var(--green)" : t.status === "in-progress" ? "var(--blue)" : "var(--orange)" }} />
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-sm font-bold" style={{ color: t.status === "done" ? "var(--text-muted)" : "var(--text-strong)", textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</span>
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>{t.event} · Due {t.due}</span>
                </div>
                <StatusBadge variant={TASK_VARIANT[t.status]}>{TASK_LABEL[t.status]}</StatusBadge>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--radius-xl)] p-6 flex flex-col gap-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--primary-hex,#6366f1) 0%, #8b5cf6 100%)", color: "#fff", boxShadow: "var(--shadow-glow)" }}>
            <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 80% 20%, #fff, transparent 60%)" }} />
            <div className="relative flex flex-col gap-3">
              <div className="w-11 h-11 rounded-[var(--radius-md)] flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                <ScanLine size={22} />
              </div>
              <div>
                <span className="text-lg font-extrabold block">Check-in Scanner</span>
                <span className="text-sm opacity-80">Scan guest QR codes for NorthStar Summit</span>
              </div>
              <Button asChild size="sm" className="self-start" style={{ background: "#fff", color: "var(--primary-hex,#6366f1)", fontWeight: 700 }}>
                <Link href="/events/ev1/scanner">Launch scanner <ArrowRight size={14} /></Link>
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="px-5 py-4 flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>Next event</span>
              <span className="text-sm font-extrabold" style={{ color: "var(--text-strong)" }}>NorthStar Leadership Summit</span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Jun 18, 2026 · Grand Hall A</span>
              <StatusBadge variant="primary">Live</StatusBadge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Root: selects view by role ── */
export default function DashboardPage() {
  const [role, setRole] = useState<Role>("handler");

  useEffect(() => {
    const stored = sessionStorage.getItem("gatherly_role") as Role | null;
    if (stored === "admin" || stored === "subadmin" || stored === "handler") setRole(stored);
  }, []);

  if (role === "admin")    return <AdminDashboard />;
  if (role === "subadmin") return <ManagerDashboard />;
  return <HandlerDashboard />;
}
