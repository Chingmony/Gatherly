"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { publishEvent, archiveEvent, deleteEvent } from "@/lib/api/events";
import type {
  AgendaResponse, AgendaTemplateResponse, AssignmentResponse, EventResponse, EventStatus,
  FormResponse, MaterialResponse, SubmissionResponse, UserResponse,
} from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DetailsForm } from "./details-form";
import { AgendaEditor } from "./agenda-editor";
import { MembersTab } from "./members-tab";
import { MaterialsTab } from "./materials-tab";
import { GuestsTab } from "./guests-tab";
import { FormBuilder } from "@/components/form-builder";

const STATUS_LABEL: Record<EventStatus, string> = { DRAFT: "Draft", PUBLIC: "Public", ARCHIVED: "Archived" };
type Tab = "details" | "agenda" | "members" | "materials" | "guests" | "form";
const CARD = "rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]";

/** Event workspace (docs/05 §7): tabbed detail view — Details · Agenda · Members · Guests · Form. */
export function EventWorkspace({
  event, agenda, templates, assignments, materials, submissions, candidates, form, isAdmin, canManage,
}: {
  event: EventResponse;
  agenda: AgendaResponse;
  templates: AgendaTemplateResponse[];
  assignments: AssignmentResponse[];
  materials: MaterialResponse[];
  submissions: SubmissionResponse[];
  candidates: UserResponse[];
  form: FormResponse | null;
  isAdmin: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("details");
  const [busy, setBusy] = useState(false);

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "details", label: "Details" },
    { id: "agenda", label: "Agenda", count: agenda.items.length },
    { id: "members", label: "Members", count: assignments.length },
    { id: "materials", label: "Materials", count: materials.length },
    { id: "guests", label: "Guests", count: submissions.length },
    { id: "form", label: "Form" },
  ];

  async function runStatus(action: () => Promise<unknown>, after?: () => void) {
    setBusy(true);
    try { await action(); (after ?? router.refresh)(); } catch { router.refresh(); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-[22px] font-extrabold tracking-[-0.01em] text-[var(--text-strong)]">{event.title}</h1>
          <p className="text-[12px] font-semibold text-[var(--text-faint)]">/{event.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={event.status === "PUBLIC" ? "green" : "neutral"}>{STATUS_LABEL[event.status]}</Badge>
          {event.status === "DRAFT" && <Button variant="ghost" size="sm" disabled={busy} onClick={() => runStatus(() => publishEvent(event.id))}>Publish</Button>}
          {event.status !== "ARCHIVED" && <Button variant="ghost" size="sm" disabled={busy} onClick={() => runStatus(() => archiveEvent(event.id))}>Archive</Button>}
          {isAdmin && <Button variant="danger" size="sm" disabled={busy} onClick={() => runStatus(() => deleteEvent(event.id), () => router.push("/events"))}>Delete</Button>}
        </div>
      </div>

      <div className="flex gap-1 border-b border-[var(--border)]">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="relative px-4 py-2.5 text-[13.5px] font-bold transition-colors"
            style={{ color: tab === t.id ? "var(--primary)" : "var(--text-muted)" }}>
            {t.label}{t.count != null && <span className="ml-1.5 text-[11px] text-[var(--text-faint)]">{t.count}</span>}
            {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--primary)]" />}
          </button>
        ))}
      </div>

      {tab === "details" && <div className={CARD}><DetailsForm event={event} /></div>}
      {tab === "agenda" && <div className={CARD}><AgendaEditor event={event} agenda={agenda} templates={templates} /></div>}
      {tab === "members" && <MembersTab eventId={event.id} assignments={assignments} candidates={candidates} canPickUsers={isAdmin} />}
      {tab === "materials" && <MaterialsTab eventId={event.id} materials={materials} crew={assignments} canManage={canManage} />}
      {tab === "guests" && <GuestsTab submissions={submissions} />}
      {tab === "form" && <div className={CARD}><FormBuilder eventId={event.id} initial={form} /></div>}
    </div>
  );
}
