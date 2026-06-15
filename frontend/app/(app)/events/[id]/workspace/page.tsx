"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Calendar, MapPin, CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api/client";
import type { EventResponse, MaterialResponse, MaterialStatus } from "@/lib/types";

type UIStatus = "IN_PROGRESS" | "NEEDS_REVIEW" | "PENDING" | "ISSUE" | "DONE";

const STATUS_VARIANT: Record<UIStatus, "blue" | "orange" | "gray" | "green" | "danger"> = {
  IN_PROGRESS:  "blue",
  NEEDS_REVIEW: "orange",
  PENDING:      "gray",
  ISSUE:        "danger",
  DONE:         "green",
};

const STATUS_LABEL: Record<UIStatus, string> = {
  IN_PROGRESS:  "In progress",
  NEEDS_REVIEW: "Needs review",
  PENDING:      "To do",
  ISSUE:        "Issue",
  DONE:         "Done",
};

const EVENT_STATUS_VARIANT: Record<string, "primary" | "green" | "gray" | "orange"> = {
  PUBLIC:   "green",
  DRAFT:    "gray",
  ARCHIVED: "orange",
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function WorkspacePage() {
  const params = useParams();
  const id = params.id as string;

  const [event, setEvent]       = useState<EventResponse | null>(null);
  const [materials, setMaterials] = useState<MaterialResponse[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [eventRes, materialsRes] = await Promise.all([
          apiFetch<EventResponse>(`/events/${id}`),
          apiFetch<MaterialResponse[]>(`/events/${id}/materials?size=100`),
        ]);
        setEvent(eventRes);
        setMaterials(materialsRes ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load event");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 view-anim">
        <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: "var(--surface-2)" }} />
        <div className="h-48 rounded-[var(--radius-xl)] animate-pulse" style={{ background: "var(--surface-2)" }} />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-[var(--radius-lg)] animate-pulse" style={{ background: "var(--surface-2)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col gap-5 view-anim">
        <PageHeader title="Event workspace" />
        <Card>
          <CardContent className="px-5 py-12 text-center">
            <span className="text-sm" style={{ color: "var(--danger)" }}>{error ?? "Event not found."}</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  const doneMaterials = materials.filter((m) => m.status === "DONE").length;

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
          <StatusBadge variant={EVENT_STATUS_VARIANT[event.status] ?? "gray"}>
            {event.status.charAt(0) + event.status.slice(1).toLowerCase()}
          </StatusBadge>
        </div>
        <div
          className="px-6 py-5"
          style={{ background: "var(--surface)", borderTop: "1px solid var(--border-hex,#ecedf4)" }}
        >
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <h1 className="text-[22px] font-extrabold m-0 leading-tight" style={{ color: "var(--text-strong)" }}>
              {event.title}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                <Calendar size={13} /> {formatDateTime(event.startsAt)}
              </span>
              {event.venue && (
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                  <MapPin size={13} /> {event.venue}
                </span>
              )}
            </div>
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
          <div className="flex flex-col gap-5">
            {event.description && (
              <Card>
                <CardHeader className="px-6 pt-6 pb-2"><CardTitle>About this event</CardTitle></CardHeader>
                <CardContent className="px-6 pb-6 pt-3">
                  <p className="text-[14px] leading-relaxed m-0" style={{ color: "var(--text-muted)" }}>
                    {event.description}
                  </p>
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Materials",  value: materials.length.toString(), color: "var(--primary-hex,#6366f1)" },
                { label: "Completed",  value: doneMaterials.toString(),    color: "var(--green-600)" },
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

        {/* Members — placeholder until endpoint is available */}
        <TabsContent value="members" className="mt-5">
          <Card>
            <CardContent className="px-5 py-12 text-center">
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>Member list coming soon.</span>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agenda — placeholder until endpoint is available */}
        <TabsContent value="agenda" className="mt-5">
          <Card>
            <CardContent className="px-5 py-12 text-center">
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>Agenda coming soon.</span>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials */}
        <TabsContent value="materials" className="mt-5">
          <div className="flex flex-col gap-4">
            <span className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>
              {materials.length} supply task{materials.length !== 1 ? "s" : ""}
            </span>
            {materials.length === 0 ? (
              <Card>
                <CardContent className="px-5 py-12 text-center">
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>No materials for this event.</span>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {materials.map((m) => {
                  const s = m.status as UIStatus;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-4 px-5 py-4 rounded-[var(--radius-lg)] border"
                      style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
                    >
                      <CheckSquare size={16} style={{ color: "var(--primary-hex,#6366f1)", flexShrink: 0 }} />
                      <span className="flex-1 font-semibold text-sm" style={{ color: "var(--text-strong)" }}>{m.name}</span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {m.assignedTo ? m.assignedTo.slice(0, 8) + "…" : "Unassigned"}
                      </span>
                      <StatusBadge variant={STATUS_VARIANT[s] ?? "gray"}>
                        {STATUS_LABEL[s] ?? m.status}
                      </StatusBadge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
