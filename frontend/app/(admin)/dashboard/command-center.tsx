"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  AlertTriangle,
  Layers,
  QrCode,
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  CheckCircle2,
  CalendarDays,
  ChevronRight,
  Building2,
} from "lucide-react";
import { publishEvent, deleteEvent } from "@/lib/api/events";
import type {
  CommandCenterResponse,
  CommandCenterEventRow,
  EventStatus,
} from "@/lib/api/types";
import { coverGradient } from "@/lib/covers";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Donut } from "@/components/charts/donut";

type Tab = "all" | "draft" | "public" | "completed";
const TAB_TO_STATUS: Record<Exclude<Tab, "all">, EventStatus> = {
  draft: "DRAFT",
  public: "PUBLIC",
  completed: "ARCHIVED",
};

export function CommandCenter({ data }: { data: CommandCenterResponse }) {
  const router = useRouter();
  const [events, setEvents] = useState<CommandCenterEventRow[]>(data.events);
  const [tab, setTab] = useState<Tab>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CommandCenterEventRow | null>(null);

  const { lifecycle, registration } = data;
  const criticalCount = data.critical.length;

  const shown = useMemo(
    () => (tab === "all" ? events : events.filter((e) => e.status === TAB_TO_STATUS[tab])),
    [events, tab],
  );

  async function onPublish(id: string) {
    setBusyId(id);
    try {
      await publishEvent(id);
      setEvents((es) => es.map((e) => (e.id === id ? { ...e, status: "PUBLIC" } : e)));
      router.refresh();
    } catch {
      /* server state wins on refresh */
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(id: string) {
    setBusyId(id);
    try {
      await deleteEvent(id);
      setEvents((es) => es.filter((e) => e.id !== id));
      router.refresh();
    } catch {
      /* no-op */
    } finally {
      setBusyId(null);
      setConfirmDelete(null);
    }
  }

  return (
    <div className="view-anim flex flex-col gap-5">
      {/* Command header */}
      <div className="flex flex-wrap items-center gap-3.5">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 whitespace-nowrap text-[23px] font-extrabold tracking-[-0.02em] text-[var(--text-strong)]">
            Command Center
          </h1>
          <div className="flex flex-wrap items-center gap-[10px]">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-[10px] py-1 text-[11.5px] font-extrabold"
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
            >
              <ShieldCheck className="h-[13px] w-[13px]" aria-hidden /> Super Admin
            </span>
            <span className="text-[13.5px] text-[var(--text-muted)]">
              Global oversight across every event in your organization
            </span>
          </div>
        </div>
        <div className="ml-auto">
          <Badge variant={criticalCount > 0 ? "danger" : "green"} dot={false} className="px-[13px] py-2">
            {criticalCount > 0 ? (
              <>
                <AlertTriangle className="h-3.5 w-3.5" /> {criticalCount} need attention
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" /> All clear
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* 1. GLOBAL PULSE */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)]">
        <PulseCard title="Event Lifecycle" sub="Active vs draft" icon={Layers} tone="primary">
          <div className="flex items-center justify-between gap-[18px]">
            <Donut
              value={lifecycle.live}
              max={Math.max(1, lifecycle.live + lifecycle.draft)}
              size={104}
              thickness={12}
              color="var(--green)"
              track="var(--surface-3)"
            >
              <span className="text-[22px] font-extrabold text-[var(--text-strong)]">{lifecycle.total}</span>
              <span className="text-[10.5px] text-[var(--text-muted)]">events</span>
            </Donut>
            <div className="flex flex-1 flex-col gap-3">
              <LegendStat color="var(--green)" label="Public · Live" value={lifecycle.live} />
              <LegendStat color="var(--text-faint)" label="Drafts" value={lifecycle.draft} />
            </div>
          </div>
        </PulseCard>

        <PulseCard title="Registration Momentum" sub="Tickets · QR issued" icon={QrCode} tone="green">
          <div className="flex flex-col gap-1">
            <span className="text-[32px] font-extrabold tracking-[-0.02em] text-[var(--text-strong)] tabular-nums">
              {registration.totalRegistered.toLocaleString()}
            </span>
            <span className="text-[12.5px] font-bold text-[var(--green-600)]">
              {registration.totalCheckedIn.toLocaleString()} checked in
            </span>
          </div>
          <div className="mt-auto flex flex-col gap-1.5">
            <div className="h-[7px] overflow-hidden rounded-full bg-[var(--surface-3)]">
              <div
                className="h-full rounded-full bg-[var(--green)] transition-[width] duration-500"
                style={{ width: `${registration.fillPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[12px] font-semibold text-[var(--text-muted)]">
              <span>{registration.fillPct}% capacity filled</span>
              <span>{lifecycle.live} live · {lifecycle.draft} upcoming</span>
            </div>
          </div>
        </PulseCard>

        <PulseCard title="Material Health Index" sub="Tasks & supplies, org-wide" icon={ShieldCheck} tone="orange">
          {data.materialHealth ? (
            <MaterialHealth health={data.materialHealth} />
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 py-6 text-center">
              <span className="text-[12.5px] font-medium text-[var(--text-muted)]">
                Material &amp; task tracking arrives with the crew workflow — no data yet.
              </span>
            </div>
          )}
        </PulseCard>
      </div>

      {/* 2. EVENT CONTROL CENTER */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <div className="px-6 pb-3.5 pt-[22px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h3 className="m-0 whitespace-nowrap text-[17px] font-extrabold text-[var(--text-strong)]">
                Event Control Center
              </h3>
              <span className="text-[12.5px] text-[var(--text-muted)]">
                Manage the full lifecycle of every event
              </span>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-[18px] py-[11px] text-[14px] font-bold text-[var(--on-primary)] shadow-[var(--shadow-glow)] transition-colors hover:bg-[var(--primary-600)]"
            >
              <Plus className="h-[17px] w-[17px]" /> Propose New Event
            </Link>
          </div>
          <div className="mt-3.5">
            <Segmented
              value={tab}
              onChange={setTab}
              options={[
                { id: "all", label: "All Events", count: lifecycle.total },
                { id: "draft", label: "Drafts", count: lifecycle.draft },
                { id: "public", label: "Public · Live", count: lifecycle.live },
                { id: "completed", label: "Completed", count: lifecycle.completed },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[12px] font-bold text-[var(--text-muted)]">
                <th className="border-b border-[var(--border)] px-3.5 py-2.5 text-left">Event</th>
                <th className="border-b border-[var(--border)] px-3.5 py-2.5 text-left">Manager</th>
                <th className="border-b border-[var(--border)] px-3.5 py-2.5 text-left">Registration</th>
                <th className="border-b border-[var(--border)] px-3.5 py-2.5 text-center">Alerts</th>
                <th className="border-b border-[var(--border)] px-3.5 py-2.5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => (
                <EventRow
                  key={e.id}
                  row={e}
                  busy={busyId === e.id}
                  onPublish={() => onPublish(e.id)}
                  onDelete={() => setConfirmDelete(e)}
                />
              ))}
            </tbody>
          </table>
          {shown.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <CalendarDays className="h-7 w-7 text-[var(--text-faint)]" />
              <span className="text-[14px] font-bold text-[var(--text-strong)]">Nothing here yet</span>
              <span className="text-[13px] text-[var(--text-muted)]">No events match this lifecycle stage.</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. CRITICAL ATTENTION + side */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
          <div className="mb-[18px] flex items-center gap-3">
            <span
              className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px]"
              style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
            >
              <AlertTriangle className="h-[18px] w-[18px]" />
            </span>
            <h3 className="m-0 whitespace-nowrap text-[17px] font-extrabold text-[var(--text-strong)]">
              Critical Attention
            </h3>
          </div>
          {data.critical.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 py-10 text-center">
              <CheckCircle2 className="h-7 w-7 text-[var(--green-600)]" />
              <span className="text-[13.5px] font-bold text-[var(--text-strong)]">No flagged issues</span>
              <span className="max-w-xs text-[12.5px] text-[var(--text-muted)]">
                Flagged crew tasks will surface here once the materials workflow is live.
              </span>
            </div>
          ) : (
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(258px,1fr))]">
              {data.critical.map((a, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 rounded-[12px] bg-[var(--surface-2)] px-3.5 py-3.5"
                  style={{ borderLeft: "3px solid var(--danger)" }}
                >
                  <span className="text-[13px] font-bold text-[var(--text-strong)]">{a.task}</span>
                  {a.note && <p className="m-0 text-[12.5px] leading-[1.5] text-[var(--text-muted)]">{a.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
            <div
              className="relative h-[76px]"
              style={{ background: "linear-gradient(120deg, var(--primary), var(--green))" }}
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-50"
                style={{
                  background:
                    "repeating-linear-gradient(125deg, rgba(255,255,255,.12) 0 1px, transparent 1px 14px)",
                }}
              />
            </div>
            <div className="px-6 pb-[22px] pt-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-px">
                  <span className="text-[15px] font-extrabold text-[var(--text-strong)]">Organization</span>
                  <span className="text-[12px] text-[var(--text-muted)]">Branding &amp; public identity</span>
                </div>
                <Link
                  href="/organization"
                  className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--primary-soft)] px-[13px] py-2 text-[13px] font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary-ring)]"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit Profile
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
            <h3 className="mb-3 m-0 whitespace-nowrap text-[17px] font-extrabold text-[var(--text-strong)]">
              Global Controls
            </h3>
            <div className="flex flex-col gap-2">
              <ControlShortcut href="/users" icon={ShieldCheck} title="User Management" sub="Roles & global CRUD" />
              <ControlShortcut href="/events" icon={CalendarDays} title="Events" sub="Create, publish & delegate" />
              <ControlShortcut href="/organization" icon={Building2} title="Organization Profile" sub="Branding & identity" />
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} titleId="delete-event-title">
        <h2 id="delete-event-title" className="text-[15px] font-bold tracking-[-0.01em] text-[var(--text-strong)]">
          Delete event?
        </h2>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">
          “{confirmDelete?.title}” will be permanently deleted. This can’t be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setConfirmDelete(null)}
            className="inline-flex items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] px-[18px] py-[11px] text-[14px] font-bold text-[var(--text)] transition-colors hover:border-[var(--primary-ring)]"
          >
            Cancel
          </button>
          <button
            disabled={!!busyId}
            onClick={() => confirmDelete && onDelete(confirmDelete.id)}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--danger)] px-[18px] py-[11px] text-[14px] font-bold text-[var(--on-primary)] transition-opacity disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> Delete event
          </button>
        </div>
      </Dialog>
    </div>
  );
}

// ---- Pieces ---------------------------------------------------------------

function EventRow({
  row,
  busy,
  onPublish,
  onDelete,
}: {
  row: CommandCenterEventRow;
  busy: boolean;
  onPublish: () => void;
  onDelete: () => void;
}) {
  const pct = row.capacity && row.capacity > 0 ? Math.round((row.registered / row.capacity) * 100) : 0;
  return (
    <tr className="transition-colors hover:bg-[var(--surface-2)]">
      <td className="border-b border-[var(--border)] px-3.5 py-3.5 align-middle">
        <div className="flex items-center gap-[10px]">
          <span
            aria-hidden
            className="h-9 w-9 shrink-0 rounded-[9px]"
            style={{ background: coverGradient(row.coverGradient) }}
          />
          <div className="flex min-w-0 flex-col gap-px">
            <span className="whitespace-nowrap text-[13.5px] font-bold text-[var(--text)]">{row.title}</span>
            <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-muted)]">
              <CalendarDays className="h-3 w-3" /> {formatDate(row.startsAt)}
              {row.venue && <span className="text-[var(--text-faint)]">· {row.venue.split(",")[0]}</span>}
            </span>
          </div>
        </div>
      </td>
      <td className="border-b border-[var(--border)] px-3.5 py-3.5 align-middle">
        {row.managerName ? (
          <div className="flex items-center gap-2">
            <Avatar name={row.managerName} size={28} />
            <span className="whitespace-nowrap text-[13px] font-semibold text-[var(--text)]">
              {row.managerName}
            </span>
          </div>
        ) : (
          <Badge variant="orange" dot={false}>
            <AlertTriangle className="h-3.5 w-3.5" /> Unassigned
          </Badge>
        )}
      </td>
      <td className="min-w-[150px] border-b border-[var(--border)] px-3.5 py-3.5 align-middle">
        <div className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-bold tabular-nums text-[var(--text)]">
            {row.registered.toLocaleString()}
            {row.capacity ? ` / ${row.capacity.toLocaleString()}` : " · ∞"}
          </span>
          <div className="h-[7px] w-[130px] overflow-hidden rounded-full bg-[var(--surface-3)]">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.min(100, pct)}%`,
                background: row.status === "ARCHIVED" ? "var(--green)" : "var(--primary)",
              }}
            />
          </div>
        </div>
      </td>
      <td className="border-b border-[var(--border)] px-3.5 py-3.5 text-center align-middle">
        {row.issueCount > 0 ? (
          <Badge variant="danger" dot={false} className="px-2.5 py-1">
            <AlertTriangle className="h-3.5 w-3.5" /> {row.issueCount}
          </Badge>
        ) : (
          <CheckCircle2 className="inline h-[17px] w-[17px] text-[var(--green-600)]" aria-label="No issues" />
        )}
      </td>
      <td className="border-b border-[var(--border)] px-3.5 py-3.5 align-middle">
        <div className="flex justify-end gap-1.5">
          {row.status === "DRAFT" && (
            <button
              disabled={busy}
              onClick={onPublish}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-[13px] py-2 text-[13px] font-bold transition-opacity disabled:opacity-50"
              style={{ background: "var(--green-soft)", color: "var(--green-600)" }}
            >
              <Megaphone className="h-3.5 w-3.5" /> Publish
            </button>
          )}
          <Link
            href={`/events/${row.id}`}
            aria-label={`Edit ${row.title}`}
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] p-2 text-[var(--text)] transition-colors hover:border-[var(--primary-ring)] hover:text-[var(--primary)]"
          >
            <Pencil className="h-[15px] w-[15px]" />
          </Link>
          <button
            disabled={busy}
            onClick={onDelete}
            aria-label={`Delete ${row.title}`}
            className="inline-flex items-center justify-center rounded-[var(--radius-sm)] p-2 transition-colors disabled:opacity-50"
            style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
          >
            <Trash2 className="h-[15px] w-[15px]" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function MaterialHealth({ health }: { health: NonNullable<CommandCenterResponse["materialHealth"]> }) {
  const total = Math.max(1, health.total);
  const palette: Record<string, string> = {
    done: "var(--green-600)",
    progress: "var(--blue)",
    pending: "var(--text-faint)",
    review: "var(--orange)",
    issue: "var(--danger)",
  };
  return (
    <>
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-px">
          <span className="text-[30px] font-extrabold tracking-[-0.02em] text-[var(--text-strong)]">
            {health.onTrackPct}%
          </span>
          <span className="text-[12.5px] text-[var(--text-muted)]">on track · {health.total} items</span>
        </div>
        <Badge variant="danger" dot={false}>
          <AlertTriangle className="h-3 w-3" /> {health.issues} issues
        </Badge>
      </div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
        {health.buckets.map((b) => (
          <div
            key={b.id}
            title={`${b.label}: ${b.count}`}
            style={{ width: `${(b.count / total) * 100}%`, background: palette[b.id] ?? "var(--text-faint)" }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {health.buckets.map((b) => (
          <span key={b.id} className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text)]">
            <span className="h-2 w-2 rounded-full" style={{ background: palette[b.id] ?? "var(--text-faint)" }} />
            {b.label}
            <span className="font-extrabold">{b.count}</span>
          </span>
        ))}
      </div>
    </>
  );
}

function PulseCard({
  title,
  sub,
  icon: Icon,
  tone,
  children,
}: {
  title: string;
  sub: string;
  icon: typeof Layers;
  tone: "primary" | "green" | "orange";
  children: React.ReactNode;
}) {
  const tones = {
    primary: ["var(--primary)", "var(--primary-soft)"],
    green: ["var(--green-600)", "var(--green-soft)"],
    orange: ["var(--orange)", "var(--orange-soft)"],
  }[tone];
  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-[10px]">
        <span
          className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px]"
          style={{ background: tones[1], color: tones[0] }}
        >
          <Icon className="h-[19px] w-[19px]" />
        </span>
        <div className="flex flex-col">
          <span className="whitespace-nowrap text-[14.5px] font-extrabold text-[var(--text-strong)]">{title}</span>
          <span className="text-[12px] text-[var(--text-muted)]">{sub}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function LegendStat({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--text)]">
        <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: color }} /> {label}
      </span>
      <span className="text-[20px] font-extrabold text-[var(--text-strong)]">{value}</span>
    </div>
  );
}

function ControlShortcut({
  href,
  icon: Icon,
  title,
  sub,
}: {
  href: string;
  icon: typeof Layers;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[11px] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-[11px] transition-colors hover:border-[var(--primary-ring)]"
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-[10px]"
        style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="flex flex-1 flex-col">
        <span className="text-[13.5px] font-bold text-[var(--text)]">{title}</span>
        <span className="text-[12px] text-[var(--text-muted)]">{sub}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-[var(--text-faint)]" />
    </Link>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: Tab;
  onChange: (v: Tab) => void;
  options: { id: Tab; label: string; count: number }[];
}) {
  return (
    <div
      className="inline-flex gap-0.5 rounded-[11px] border border-[var(--border)] bg-[var(--surface-2)] p-[3px]"
      role="tablist"
    >
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-bold transition-all"
            style={{
              background: on ? "var(--surface)" : "transparent",
              color: on ? "var(--primary)" : "var(--text-muted)",
              boxShadow: on ? "var(--shadow-sm)" : "none",
            }}
          >
            {o.label}
            <span className="text-[11px] font-extrabold opacity-70">{o.count}</span>
          </button>
        );
      })}
    </div>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "Date TBA";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
