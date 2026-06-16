"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  QrCode, CheckSquare, Calendar, MapPin, Users, UserCheck, Hourglass, Search, Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getEvent, type AdminEvent, type EventStatus } from "@/lib/api/events";
import {
  getAttendance, listSubmissions, maskEmail, maskPhone,
  type AttendanceSummary, type SubmissionSummary,
} from "@/lib/api/attendance";
import { ApiError } from "@/lib/api/client";

const STATUS_META: Record<EventStatus, { variant: "green" | "gray" | "orange"; label: string }> = {
  PUBLIC:   { variant: "green",  label: "Public" },
  DRAFT:    { variant: "gray",   label: "Draft" },
  ARCHIVED: { variant: "orange", label: "Archived" },
};

function formatDate(iso: string | null) {
  if (!iso) return "Date TBD";
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit", year: "numeric" });
}
function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "numeric", minute: "2-digit" });
}

/** Ticket status → badge. Mirrors backend `TicketStatus`; unknown values fall back to gray. */
function ticketBadge(status: string): { variant: "green" | "blue" | "danger" | "gray"; label: string } {
  switch (status.toUpperCase()) {
    case "CHECKED_IN": return { variant: "green",  label: "Checked in" };
    case "VALID":      return { variant: "blue",   label: "Valid" };
    case "REVOKED":    return { variant: "danger", label: "Revoked" };
    case "EXPIRED":    return { variant: "gray",   label: "Expired" };
    default:           return { variant: "gray",   label: status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ") };
  }
}

export default function EventDetailPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <EventDetail />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <div className="py-24 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
      <Loader2 size={18} className="animate-spin" /> Loading…
    </div>
  );
}

function EventDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") === "attendance" ? "attendance" : "details";

  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [eventErr, setEventErr] = useState<string | null>(null);
  const [eventLoading, setEventLoading] = useState(true);

  const [att, setAtt] = useState<AttendanceSummary | null>(null);
  const [attErr, setAttErr] = useState<string | null>(null);
  const [subs, setSubs] = useState<SubmissionSummary[]>([]);
  const [attLoading, setAttLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setEventLoading(true);
    setEventErr(null);
    getEvent(id)
      .then((e) => { if (!cancelled) setEvent(e); })
      .catch((e) => { if (!cancelled) setEventErr(e instanceof ApiError ? e.message : "Failed to load event."); })
      .finally(() => { if (!cancelled) setEventLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  // Attendance + registrations are independent reads: one failing must not blank the other.
  useEffect(() => {
    let cancelled = false;
    setAttLoading(true);
    setAttErr(null);
    Promise.allSettled([getAttendance(id), listSubmissions(id)]).then(([a, s]) => {
      if (cancelled) return;
      if (a.status === "fulfilled") setAtt(a.value);
      else setAttErr(a.reason instanceof ApiError ? a.reason.message : "Failed to load attendance.");
      if (s.status === "fulfilled") setSubs(s.value ?? []);
      setAttLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  const filteredSubs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subs;
    return subs.filter((s) => s.guestName.toLowerCase().includes(q) || s.qrStatus.toLowerCase().includes(q));
  }, [subs, query]);

  function setTab(v: string) {
    router.replace(`/events/${id}?tab=${v}`, { scroll: false });
  }

  if (eventLoading) return <LoadingState />;
  if (eventErr || !event) {
    return (
      <div className="py-24 text-center text-sm" style={{ color: "var(--danger)" }}>
        {eventErr ?? "Event not found."}
      </div>
    );
  }

  const st = STATUS_META[event.status];
  const remaining = att ? Math.max(0, att.totalRegistered - att.totalCheckedIn) : 0;

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title={event.title} sub="Event details & attendance" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        {/* ── Details ── */}
        <TabsContent value="details">
          <Card>
            <CardContent className="px-4 md:px-6 py-6 flex flex-col gap-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-extrabold tracking-tight m-0 min-w-0 break-words" style={{ color: "var(--text-strong)" }}>
                  {event.title}
                </h2>
                <StatusBadge variant={st.variant} dot>{st.label}</StatusBadge>
              </div>

              <div className="flex flex-col gap-2.5 text-sm" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-2.5">
                  <Calendar size={16} className="flex-shrink-0" style={{ color: "var(--text-faint)" }} />
                  <span>{formatDate(event.startsAt)}{event.endsAt ? ` – ${formatDate(event.endsAt)}` : ""}</span>
                </span>
                <span className="flex items-center gap-2.5">
                  <MapPin size={16} className="flex-shrink-0" style={{ color: "var(--text-faint)" }} />
                  <span className="break-words min-w-0">{event.venue ?? "—"}</span>
                </span>
              </div>

              {event.description && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-faint)" }}>About</span>
                  <p className="text-sm leading-relaxed m-0 break-words" style={{ color: "var(--text-muted)" }}>
                    {event.description}
                  </p>
                </div>
              )}

              <Separator />

              {/* Hub actions — side by side */}
              <div className="grid grid-cols-2 gap-3">
                <Button asChild className="w-full">
                  <Link href={`/events/${id}/scanner`}><QrCode size={16} /> Open scanner</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href={`/tasks?event=${id}`}><CheckSquare size={16} /> My tasks</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Attendance ── */}
        <TabsContent value="attendance">
          {attLoading ? (
            <LoadingState />
          ) : attErr && !att ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--danger)" }}>{attErr}</div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Counts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatTile label="Registered" value={att?.totalRegistered ?? 0} icon={Users}
                  iconColor="var(--blue)" iconBg="var(--blue-soft)" />
                <StatTile label="Checked in" value={att?.totalCheckedIn ?? 0} icon={UserCheck}
                  iconColor="var(--green-600)" iconBg="var(--green-soft)" />
                <StatTile label="Remaining" value={remaining} icon={Hourglass}
                  iconColor="var(--orange)" iconBg="var(--orange-soft)" />
              </div>

              {/* Checked-in list */}
              <Card>
                <CardContent className="px-4 md:px-6 py-6 flex flex-col gap-4">
                  <h3 className="text-sm font-extrabold m-0" style={{ color: "var(--text-strong)" }}>
                    Checked in ({att?.checkins.length ?? 0})
                  </h3>
                  <Separator />
                  {!att || att.checkins.length === 0 ? (
                    <p className="text-sm m-0" style={{ color: "var(--text-faint)" }}>No guests checked in yet.</p>
                  ) : (
                    <ul className="flex flex-col">
                      {att.checkins.map((c) => (
                        <li key={c.checkinId} className="flex items-center justify-between gap-3 py-2.5 border-b last:border-0"
                          style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
                          <span className="text-sm font-semibold truncate" style={{ color: "var(--text-strong)" }}>{c.guestName}</span>
                          <span className="text-xs flex-shrink-0" style={{ color: "var(--text-faint)" }}>{formatDateTime(c.checkedInAt)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              {/* Registrant lookup — name + status only; contact details masked */}
              <Card>
                <CardContent className="px-4 md:px-6 py-6 flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-extrabold m-0" style={{ color: "var(--text-strong)" }}>
                      Registrations ({subs.length})
                    </h3>
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
                      <input
                        type="search"
                        placeholder="Search by name…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-[220px] h-10 pl-9 pr-3 rounded-[var(--radius-md)] border text-sm transition-all focus:outline-none focus:border-[var(--primary-hex,#6366f1)] focus:shadow-[0_0_0_4px_var(--primary-ring)]"
                        style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }}
                      />
                    </div>
                  </div>
                  <Separator />
                  {subs.length === 0 ? (
                    <EmptyState icon={Users} title="No registrations" description="No one has registered for this event yet." />
                  ) : filteredSubs.length === 0 ? (
                    <p className="text-sm m-0" style={{ color: "var(--text-faint)" }}>No registrations match “{query}”.</p>
                  ) : (
                    <ul className="flex flex-col">
                      {filteredSubs.map((s) => {
                        const tb = ticketBadge(s.qrStatus);
                        return (
                          <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 border-b last:border-0"
                            style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-sm font-semibold truncate" style={{ color: "var(--text-strong)" }}>{s.guestName}</span>
                              <span className="text-xs truncate" style={{ color: "var(--text-faint)" }}>
                                {maskEmail(s.guestEmail)} · {maskPhone(s.guestPhone)}
                              </span>
                            </div>
                            <StatusBadge variant={tb.variant}>{tb.label}</StatusBadge>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
