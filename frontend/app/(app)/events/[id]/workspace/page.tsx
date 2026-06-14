"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Calendar, MapPin, Users, Edit2, MoreHorizontal, CheckSquare, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { AvatarUser } from "@/components/ui/avatar-user";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Mock event data ──────────────────────────────────────────────────────────
const EVENT = {
  id: "ev1",
  name: "NorthStar Leadership Summit",
  date: "Jun 18, 2026",
  time: "9:00 AM",
  location: "Moscone Center, San Francisco, CA",
  status: "live",
  registered: 842,
  capacity: 1000,
  fillPct: 84,
  description: "A premier gathering for enterprise leaders focused on resilient strategy and cross-functional alignment. Featuring keynotes, roundtables, and hands-on workshops across three stages.",
};

const MEMBERS = [
  { id: "m1", name: "Ava Mitchell",  email: "ava@acme.io",   role: "MANAGER", status: "active" },
  { id: "m2", name: "Leo Fernandez", email: "leo@acme.io",   role: "HANDLER", status: "active" },
  { id: "m3", name: "Zara Khan",     email: "zara@acme.io",  role: "HANDLER", status: "active" },
  { id: "m4", name: "Noah Carter",   email: "noah@acme.io",  role: "HANDLER", status: "pending" },
];

const AGENDA = [
  { time: "8:30 AM",  title: "Registration & Badge Pickup",           type: "logistics",  speaker: "" },
  { time: "9:00 AM",  title: "Opening Keynote: The Resilient Leader", type: "keynote",    speaker: "Dr. Sarah Lin" },
  { time: "10:15 AM", title: "Coffee Break",                          type: "break",      speaker: "" },
  { time: "10:30 AM", title: "Roundtable: Cross-functional Strategy", type: "workshop",   speaker: "Panel of 4" },
  { time: "12:00 PM", title: "Networking Lunch",                      type: "break",      speaker: "" },
  { time: "1:30 PM",  title: "Workshop: OKR Alignment at Scale",      type: "workshop",   speaker: "Marco Reyes" },
  { time: "3:00 PM",  title: "Fireside Chat",                         type: "keynote",    speaker: "CEO Panel" },
  { time: "4:30 PM",  title: "Closing Ceremony + Raffle",             type: "logistics",  speaker: "" },
];

const MATERIALS = [
  { id: "r1", name: "Registration table",  assigned: "Zara Khan",    status: "in-progress" },
  { id: "r2", name: "Stage A/V check",     assigned: "Leo Fernandez", status: "done" },
  { id: "r3", name: "Sponsor banner setup",assigned: "Noah Carter",   status: "todo" },
  { id: "r4", name: "Catering coordination",assigned: "Ava Mitchell", status: "todo" },
];

const AGENDA_TYPE_COLOR: Record<string, { bg: string; color: string; label: string }> = {
  keynote:   { bg: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)", label: "Keynote" },
  workshop:  { bg: "var(--blue-soft)",    color: "var(--blue)",                label: "Workshop" },
  break:     { bg: "var(--green-soft)",   color: "var(--green-600)",           label: "Break" },
  logistics: { bg: "var(--orange-soft)",  color: "var(--orange)",              label: "Logistics" },
};

const TASK_STATUS: Record<string, "green" | "blue" | "gray"> = {
  done: "green",
  "in-progress": "blue",
  todo: "gray",
};

export default function WorkspacePage() {
  const params = useParams();

  return (
    <div className="flex flex-col gap-6 view-anim">
      {/* ── Event cover header ── */}
      <div
        className="rounded-[var(--radius-xl)] overflow-hidden"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div
          className="h-36 flex items-end px-6 pb-5"
          style={{ background: "linear-gradient(135deg, var(--primary-hex,#6366f1), color-mix(in srgb, var(--primary-hex,#6366f1) 40%, #22c55e))" }}
        >
          <StatusBadge variant={EVENT.status === "live" ? "primary" : "green"}>
            {EVENT.status === "live" ? "Live" : "Published"}
          </StatusBadge>
        </div>
        <div
          className="px-6 py-5 flex items-start gap-5"
          style={{ background: "var(--surface)", borderTop: "1px solid var(--border-hex,#ecedf4)" }}
        >
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <h1 className="text-[22px] font-extrabold m-0 leading-tight" style={{ color: "var(--text-strong)" }}>
              {EVENT.name}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                <Calendar size={13} /> {EVENT.date} at {EVENT.time}
              </span>
              <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                <MapPin size={13} /> {EVENT.location}
              </span>
              <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                <Users size={13} /> {EVENT.registered.toLocaleString()} / {EVENT.capacity.toLocaleString()} registered
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm"><Edit2 size={13} /> Edit</Button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-5">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
            <div className="flex flex-col gap-5">
              <Card>
                <CardHeader className="px-6 pt-6 pb-2"><CardTitle>About this event</CardTitle></CardHeader>
                <CardContent className="px-6 pb-6 pt-3">
                  <p className="text-[14px] leading-relaxed m-0" style={{ color: "var(--text-muted)" }}>{EVENT.description}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-6 py-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>Registration fill rate</span>
                    <span className="text-sm font-extrabold" style={{ color: "var(--primary-hex,#6366f1)" }}>{EVENT.fillPct}%</span>
                  </div>
                  <Progress value={EVENT.fillPct} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {EVENT.capacity - EVENT.registered} spots remaining
                  </span>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { label: "Registered", value: EVENT.registered.toLocaleString(), color: "var(--primary-hex,#6366f1)" },
                { label: "Capacity",   value: EVENT.capacity.toLocaleString(),   color: "var(--text-strong)" },
                { label: "Checked in", value: "0",                               color: "var(--green-600)" },
                { label: "Team size",  value: MEMBERS.length.toString(),          color: "var(--blue)" },
              ].map(({ label, value, color }) => (
                <Card key={label}>
                  <CardContent className="px-5 py-4 flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{label}</span>
                    <span className="text-xl font-extrabold" style={{ color }}>{value}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="mt-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>{MEMBERS.length} team members assigned</span>
              <Button size="sm"><Plus size={13} /> Assign member</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-hex,#ecedf4)" }}>
                        {["Member", "Event role", "Status", ""].map((h) => (
                          <th key={h} className="text-left text-xs font-bold uppercase tracking-wider px-5 py-3.5" style={{ color: "var(--text-muted)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MEMBERS.map((m, i) => (
                        <tr
                          key={m.id}
                          className="transition-colors hover:bg-[var(--surface-2)]"
                          style={{ borderBottom: i === MEMBERS.length - 1 ? "none" : "1px solid var(--border-hex,#ecedf4)" }}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <AvatarUser name={m.name} size={34} />
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold" style={{ color: "var(--text-strong)" }}>{m.name}</span>
                                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{m.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge variant={m.role === "MANAGER" ? "teal" : "orange"}>{m.role}</StatusBadge>
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge variant={m.status === "active" ? "green" : "gray"}>
                              {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                            </StatusBadge>
                          </td>
                          <td className="px-5 py-3.5">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm"><MoreHorizontal size={15} /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Change role</DropdownMenuItem>
                                <DropdownMenuItem className="text-[var(--danger)]">Remove</DropdownMenuItem>
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
          </div>
        </TabsContent>

        {/* Agenda */}
        <TabsContent value="agenda" className="mt-5">
          <div className="flex flex-col gap-3">
            {AGENDA.map((item, i) => {
              const type = AGENDA_TYPE_COLOR[item.type] ?? AGENDA_TYPE_COLOR.logistics;
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-4 rounded-[var(--radius-lg)] border transition-colors hover:bg-[var(--surface-2)]"
                  style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
                >
                  <span
                    className="text-[13px] font-bold whitespace-nowrap"
                    style={{ color: "var(--text-muted)", width: 74, flexShrink: 0 }}
                  >
                    {item.time}
                  </span>
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: type.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{item.title}</span>
                    {item.speaker && (
                      <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>{item.speaker}</span>
                    )}
                  </div>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: type.bg, color: type.color }}
                  >
                    {type.label}
                  </span>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Materials / Tasks */}
        <TabsContent value="materials" className="mt-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>{MATERIALS.length} supply tasks</span>
              <Button size="sm"><Plus size={13} /> Add task</Button>
            </div>
            <div className="flex flex-col gap-3">
              {MATERIALS.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 px-5 py-4 rounded-[var(--radius-lg)] border transition-colors hover:bg-[var(--surface-2)]"
                  style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
                >
                  <CheckSquare size={16} style={{ color: "var(--primary-hex,#6366f1)", flexShrink: 0 }} />
                  <span className="flex-1 font-semibold text-sm" style={{ color: "var(--text-strong)" }}>{task.name}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{task.assigned}</span>
                  <StatusBadge variant={TASK_STATUS[task.status] ?? "gray"}>
                    {task.status === "in-progress" ? "In progress" : task.status === "done" ? "Done" : "To do"}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
