"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar, ChevronRight, ChevronLeft, ChevronDown, Clock, Layers,
  ListChecks, Users, Settings, Eye, Pencil, Trash2, Plus,
  LayoutGrid, List as ListIcon, Loader2, AlertTriangle,
  CheckCircle2, Radio, Search, Check, MapPin, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarUser } from "@/components/ui/avatar-user";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getEvent, listEvents, deleteEvent, type AdminEvent } from "@/lib/api/events";
import {
  listMaterials, createMaterial, updateMaterial, changeMaterialStatus, deleteMaterial,
  MATERIAL_STATUS_LABEL, type MaterialResponse, type MaterialStatus, type MaterialWriteBody,
} from "@/lib/api/materials";
import {
  listAssignments, createAssignment, revokeAssignment,
  type AssignmentResponse, type EventRole,
} from "@/lib/api/assignments";
import { listUsers, type UserResponse } from "@/lib/api/users";
import {
  listSubmissions, getAttendance, manualCheckin,
  TICKET_STATUS_LABEL, type SubmissionSummary, type TicketStatus,
} from "@/lib/api/attendance";
import {
  listAgenda, createAgendaItem, updateAgendaItem, deleteAgendaItem,
  AGENDA_TYPE_STYLE, type AgendaItem, type AgendaItemInput,
} from "@/lib/api/agenda";
import { getUser } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";

const CATEGORY_GRADIENT: Record<string, string> = {
  CONFERENCE: "linear-gradient(120deg, #8e7bf2, #6d4ff0)",
  FESTIVAL:   "linear-gradient(120deg, #f2607e, #f59345)",
  NETWORKING: "linear-gradient(120deg, #28b7b0, #3b7fd4)",
  WORKSHOP:   "linear-gradient(120deg, #34c777, #1fa86a)",
  GALA:       "linear-gradient(120deg, #f5a13d, #ec5c8a)",
  HACKATHON:  "linear-gradient(120deg, #5b8df0, #4f63ef)",
  OTHER:      "linear-gradient(120deg, #7c6df2, #6d4ff0)",
};
const STRIPES = "repeating-linear-gradient(135deg, rgba(255,255,255,0.07) 0, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 13px)";
function bannerStyle(ev: AdminEvent): React.CSSProperties {
  if (ev.coverImageUrl) {
    return { backgroundImage: `linear-gradient(120deg, rgba(0,0,0,0.5), rgba(0,0,0,0.25)), url(${ev.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" };
  }
  const g = CATEGORY_GRADIENT[(ev.category ?? "").toUpperCase()] || CATEGORY_GRADIENT.OTHER;
  return { backgroundImage: `${STRIPES}, ${g}` };
}
function formatDate(iso: string | null) {
  if (!iso) return "Date TBD";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

// ── Mock data for the List/Grid views (still placeholder — Board is live) ─────
type Priority = "high" | "med" | "low";
interface Task { id: string; col: string; priority: Priority; category: string; title: string; assignee: string; due: string; time?: string; issue?: boolean }

const TASKS: Task[] = [
  { id: "t1", col: "pending",    priority: "med",  category: "Catering",   title: "Speaker green-room catering",   assignee: "Noah Pierce",  due: "Jun 24", time: "9:00" },
  { id: "t2", col: "pending",    priority: "med",  category: "Ops",        title: "Volunteer briefing packets",    assignee: "Mia Rossi",    due: "Jun 23" },
  { id: "t3", col: "pending",    priority: "low",  category: "Logistics",  title: "Parking & shuttle plan",        assignee: "Noah Pierce",  due: "Jun 25" },
  { id: "t4", col: "inprogress", priority: "high", category: "Production", title: "Stage truss + lighting rig setup", assignee: "Liam Carter", due: "Jun 24", time: "8:00" },
  { id: "t5", col: "inprogress", priority: "low",  category: "Logistics",  title: "Sponsor booth kit distribution", assignee: "Mia Rossi",    due: "Jun 23" },
  { id: "t6", col: "review",     priority: "high", category: "Production", title: "AV soundcheck — main hall",     assignee: "Liam Carter",  due: "Jun 24", time: "14:00" },
  { id: "t7", col: "review",     priority: "high", category: "Production", title: "Backstage power distribution",  assignee: "Liam Carter",  due: "Jun 24" },
  { id: "t8", col: "done",       priority: "med",  category: "Print",      title: "Registration desk signage print", assignee: "Ava Nguyen", due: "Jun 22" },
  { id: "t9", col: "done",       priority: "low",  category: "Logistics",  title: "Lanyards + badge stock count",  assignee: "Ava Nguyen",   due: "Jun 21" },
  { id: "t10", col: "issues",    priority: "high", category: "IT",         title: "Wi-Fi QA sweep failing",        assignee: "Noah Pierce",  due: "Jun 24", issue: true },
];

const COL_LABEL: Record<string, string> = {
  pending: "Pending", inprogress: "In Progress", review: "Needs Review", done: "Done", issues: "Issue",
};
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:    { bg: "var(--surface-3)",  color: "var(--text-muted)" },
  inprogress: { bg: "var(--blue-soft)",  color: "var(--blue)" },
  review:     { bg: "var(--orange-soft)", color: "var(--orange)" },
  done:       { bg: "var(--green-soft)", color: "var(--green-600)" },
  issues:     { bg: "var(--danger-soft)", color: "var(--danger)" },
};
const PRIO_LABEL: Record<Priority, string> = { high: "High", med: "Medium", low: "Low" };
const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  Production: { bg: "var(--green-soft)",  color: "var(--green-600)" },
  IT:         { bg: "var(--violet-soft)", color: "var(--violet)" },
  Ops:        { bg: "var(--blue-soft)",   color: "var(--blue)" },
  Media:      { bg: "var(--blue-soft)",   color: "var(--blue)" },
};
function catStyle(c: string) {
  return CATEGORY_STYLE[c] ?? { bg: "var(--orange-soft)", color: "var(--orange)" };
}
const ASSIGNEE_HUE: Record<string, number> = {
  "Ava Nguyen": 35, "Noah Pierce": 220, "Liam Carter": 165, "Mia Rossi": 330,
  "Sofia Marquez": 300, "Daniel Cho": 262, "Patrick Bateman": 140,
};
function hueForName(name: string) {
  if (ASSIGNEE_HUE[name] != null) return ASSIGNEE_HUE[name];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}
const PRIORITIES: Priority[] = ["high", "med", "low"];
const STATUS_KEYS = ["pending", "inprogress", "review", "done", "issues"];

const PRIORITY: Record<Priority, { bg: string; color: string }> = {
  high: { bg: "var(--danger-soft)", color: "var(--danger)" },
  med:  { bg: "var(--orange-soft)", color: "var(--orange)" },
  low:  { bg: "var(--surface-3)",   color: "var(--text-muted)" },
};

const TABS = [
  { id: "materials", label: "Materials", icon: ListChecks },
  { id: "guests",    label: "Guests",    icon: Users },
  { id: "agenda",    label: "Agenda",    icon: Calendar },
  { id: "details",   label: "Details",   icon: Settings },
];

// ── Live materials board (wired to MaterialController) ────────────────────────
const STATUS_COLUMNS: { status: MaterialStatus; label: string; dot: string }[] = [
  { status: "PENDING",      label: "Pending",      dot: "#9aa0b5" },
  { status: "IN_PROGRESS",  label: "In Progress",  dot: "var(--blue)" },
  { status: "NEEDS_REVIEW", label: "Needs Review", dot: "var(--orange)" },
  { status: "DONE",         label: "Done",         dot: "var(--green-600)" },
  { status: "ISSUE",        label: "Issues",       dot: "var(--danger)" },
];

/** Minimal shape the assignee pickers need — sourced from the event's HANDLER crew. */
type AssigneeOption = { id: string; fullName: string; email: string };

/** A single material on the board: assignee picker (event handlers only), status picker, delete. */
function MaterialCard({
  m, assignees, nameFor, onAssign, onStatus, onDelete,
}: {
  m: MaterialResponse;
  assignees: AssigneeOption[];
  nameFor: (userId: string | null) => string | null;
  onAssign: (m: MaterialResponse, userId: string | null) => void;
  onStatus: (m: MaterialResponse, to: MaterialStatus) => void;
  onDelete: (m: MaterialResponse) => void;
}) {
  const assigneeName = nameFor(m.assignedTo);
  return (
    <div className="flex flex-col gap-2.5 rounded-[var(--radius-md)] border p-3.5" style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-bold leading-snug" style={{ color: "var(--text-strong)" }}>{m.name}</span>
        <button onClick={() => onDelete(m)} title="Delete task" className="shrink-0 p-1 rounded cursor-pointer hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]" style={{ background: "none", border: "none", color: "var(--text-faint)" }}>
          <Trash2 size={13} />
        </button>
      </div>
      {m.description && <span className="text-[12px] leading-snug" style={{ color: "var(--text-muted)" }}>{m.description}</span>}
      {m.quantity != null && <span className="text-[11px] font-bold" style={{ color: "var(--text-faint)" }}>Qty: {m.quantity}</span>}
      {m.status === "ISSUE" && (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: "var(--danger)" }}><AlertTriangle size={12} /> Blocking issue</span>
      )}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {/* Assign handler */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-1.5 py-1 rounded-full cursor-pointer min-w-0" style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "none" }}>
              {assigneeName ? <AvatarUser name={assigneeName} size={18} /> : null}
              <span className="truncate">{assigneeName ?? "Unassigned"}</span> <ChevronDown size={12} className="shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[230px] max-h-[300px] overflow-y-auto">
            <div className="px-2 py-1.5 text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>Assign handler</div>
            {assignees.length === 0 && (
              <div className="px-2 py-1.5 text-[11px]" style={{ color: "var(--text-faint)" }}>No users available</div>
            )}
            {assignees.map((u) => (
              <DropdownMenuItem key={u.id} onSelect={() => onAssign(m, u.id)} className="gap-2">
                <AvatarUser name={u.fullName || u.email} size={20} />
                <div className="flex flex-col gap-0 flex-1 min-w-0">
                  <span className="text-sm truncate" style={{ color: "var(--text-strong)" }}>{u.fullName || u.email}</span>
                  <span className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{u.email}</span>
                </div>
                {u.id === m.assignedTo && <Check size={14} className="shrink-0" style={{ color: "var(--primary-hex,#6366f1)" }} />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Move status */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full cursor-pointer shrink-0" style={{ background: STATUS_STYLE_BY[m.status].bg, color: STATUS_STYLE_BY[m.status].color, border: "none" }}>
              {MATERIAL_STATUS_LABEL[m.status]} <ChevronDown size={11} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[170px]">
            <div className="px-2 py-1.5 text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>Move to</div>
            {STATUS_COLUMNS.filter((c) => c.status !== m.status).map((c) => (
              <DropdownMenuItem key={c.status} onSelect={() => onStatus(m, c.status)} className="gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} /> {c.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

const STATUS_STYLE_BY: Record<MaterialStatus, { bg: string; color: string }> = {
  PENDING:      { bg: "var(--surface-3)",   color: "var(--text-muted)" },
  IN_PROGRESS:  { bg: "var(--blue-soft)",   color: "var(--blue)" },
  NEEDS_REVIEW: { bg: "var(--orange-soft)", color: "var(--orange)" },
  DONE:         { bg: "var(--green-soft)",  color: "var(--green-600)" },
  ISSUE:        { bg: "var(--danger-soft)", color: "var(--danger)" },
};

const SELECT_CLASS =
  "flex w-full rounded-[var(--radius-md)] border border-[var(--border-hex,#ecedf4)] bg-[var(--surface-2)] px-3.5 py-[11px] text-sm text-[var(--text)] transition-all focus:outline-none focus:border-[var(--primary-hex,#6366f1)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_4px_var(--primary-ring)]";

/** Create-task modal. Fields mirror the backend MaterialRequest (status defaults to PENDING). */
function CreateTaskDialog({
  open, onOpenChange, assignees, onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assignees: AssigneeOption[];
  onCreate: (body: MaterialWriteBody) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName(""); setDescription(""); setQuantity(""); setAssignedTo(""); setSubmitting(false);
    }
  }, [open]);

  const canSubmit = name.trim().length > 0 && !submitting;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const ok = await onCreate({
      name: name.trim(),
      description: description.trim() || null,
      quantity: quantity.trim() === "" ? null : Number(quantity),
      assignedTo: assignedTo || null,
    });
    setSubmitting(false);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-11 h-11 rounded-[var(--radius-md)]" style={{ background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)" }}>
              <ListChecks size={20} />
            </span>
            <div className="flex flex-col gap-0.5">
              <DialogTitle>Add task</DialogTitle>
              <DialogDescription>Delegate a material or task to the crew</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-name">Task title <span style={{ color: "var(--danger)" }}>*</span></Label>
            <Input id="task-name" value={name} maxLength={200} autoFocus
              placeholder="e.g. Stage lighting rig setup"
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-desc">Description</Label>
              <Input id="task-desc" value={description} maxLength={2000}
                placeholder="Optional details"
                onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-qty">Quantity</Label>
              <Input id="task-qty" type="number" min={0} value={quantity}
                placeholder="—"
                onChange={(e) => setQuantity(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-handler">Assign to</Label>
            <select id="task-handler" value={assignedTo} className={SELECT_CLASS}
              onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="">Unassigned</option>
              {assignees.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName || u.email}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="default">Cancel</Button>
            </DialogClose>
            <Button type="submit" size="default" disabled={!canSubmit}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Appoint a user to the event as HANDLER (or MANAGER, Admin only). */
function AssignCrewDialog({
  open, onOpenChange, assigned, canAppointManager, onAssign,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assigned: AssignmentResponse[];
  canAppointManager: boolean;
  onAssign: (userId: string, role: EventRole) => Promise<boolean>;
}) {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [role, setRole] = useState<EventRole>("HANDLER");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch(""); setSelectedId(""); setRole("HANDLER"); setSubmitting(false);
    setLoadingUsers(true); setUsersError(null);
    let cancelled = false;
    listUsers({ size: 100 })
      .then((u) => { if (!cancelled) setUsers(u); })
      .catch((e) => {
        if (cancelled) return;
        setUsersError(e instanceof ApiError && e.status === 403
          ? "Only an admin can browse the user directory to assign crew."
          : e instanceof ApiError ? e.message : "Failed to load users.");
      })
      .finally(() => { if (!cancelled) setLoadingUsers(false); });
    return () => { cancelled = true; };
  }, [open]);

  const assignedIds = new Set(assigned.map((a) => a.userId));
  const q = search.trim().toLowerCase();
  const candidates = users.filter((u) =>
    !assignedIds.has(u.id) &&
    (!q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || submitting) return;
    setSubmitting(true);
    const ok = await onAssign(selectedId, role);
    setSubmitting(false);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-11 h-11 rounded-[var(--radius-md)]" style={{ background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)" }}>
              <Users size={20} />
            </span>
            <div className="flex flex-col gap-0.5">
              <DialogTitle>Assign crew</DialogTitle>
              <DialogDescription>Add a manager or handler to this event</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="crew-role">Role</Label>
            <select id="crew-role" value={role} className={SELECT_CLASS}
              onChange={(e) => setRole(e.target.value as EventRole)}>
              <option value="HANDLER">Handler</option>
              {canAppointManager && <option value="MANAGER">Manager (Sub-admin)</option>}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="crew-search">User</Label>
            <Input id="crew-search" value={search} placeholder="Search by name or email…"
              onChange={(e) => setSearch(e.target.value)} disabled={loadingUsers || !!usersError} />
            <div className="flex flex-col rounded-[var(--radius-md)] border max-h-[220px] overflow-y-auto" style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
              {loadingUsers ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm" style={{ color: "var(--text-muted)" }}><Loader2 size={16} className="animate-spin" /> Loading users…</div>
              ) : usersError ? (
                <div className="px-3 py-4 text-sm" style={{ color: "var(--danger)" }}>{usersError}</div>
              ) : candidates.length === 0 ? (
                <div className="px-3 py-4 text-sm" style={{ color: "var(--text-muted)" }}>No users to assign.</div>
              ) : (
                candidates.map((u) => {
                  const selected = u.id === selectedId;
                  return (
                    <button type="button" key={u.id} onClick={() => setSelectedId(u.id)}
                      className="flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer transition-colors"
                      style={{ background: selected ? "var(--primary-soft)" : "transparent", border: "none" }}>
                      <AvatarUser name={u.fullName || u.email} size={32} />
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="text-sm font-bold truncate" style={{ color: "var(--text-strong)" }}>{u.fullName || u.email}</span>
                        <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{u.email}</span>
                      </div>
                      {selected && <Check size={16} style={{ color: "var(--primary-hex,#6366f1)" }} />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="default">Cancel</Button>
            </DialogClose>
            <Button type="submit" size="default" disabled={!selectedId || submitting}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [allEvents, setAllEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState("materials");
  const [view, setView] = useState<"board" | "list" | "grid">("board");

  // Materials board + event handlers (assignees), wired to the backend.
  const [materials, setMaterials] = useState<MaterialResponse[]>([]);
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserResponse[]>([]);

  // Global role drives whether MANAGER appointment is offered (Admin-only).
  useEffect(() => { setIsAdmin(getUser()?.globalRole === "ADMIN"); }, []);

  // All users (Admin-only endpoint) — the board's "Assign handler" picker lists USER-role accounts.
  useEffect(() => {
    let cancelled = false;
    listUsers({ size: 100 })
      .then((u) => { if (!cancelled) setUsers(u); })
      .catch(() => { /* GET /users is Admin-only; non-admins get an empty picker */ });
    return () => { cancelled = true; };
  }, []);

  // Open the tab requested via ?tab= (e.g. the events list "view details" eye icon, or a refresh).
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested && TABS.some((t) => t.id === requested)) setTab(requested);
  }, []);

  // Switch tab and mirror it into ?tab= so a refresh / shared link reopens the same tab.
  const selectTab = useCallback((next: string) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url.toString());
  }, []);

  useEffect(() => {
    let cancelled = false;
    getEvent(id)
      .then((ev) => { if (!cancelled) setEvent(ev); })
      .catch((e) => { if (!cancelled) setLoadError(e instanceof ApiError ? e.message : "Failed to load event."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  // Other events for the "Switch event" dropdown.
  useEffect(() => {
    let cancelled = false;
    listEvents()
      .then((evs) => { if (!cancelled) setAllEvents(evs); })
      .catch(() => { /* dropdown stays empty on failure — non-blocking */ });
    return () => { cancelled = true; };
  }, []);

  async function handleDelete() {
    if (!event) return;
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    try {
      await deleteEvent(event.id);
      toast.success("Event deleted", `"${event.title}" was removed.`);
      router.push("/events");
    } catch (e) {
      toast.error("Couldn't delete event", e instanceof ApiError ? e.message : undefined);
    }
  }

  // Load materials + event assignments (for the handler picker).
  useEffect(() => {
    let cancelled = false;
    setMaterialsLoading(true);
    setMaterialsError(null);
    Promise.all([listMaterials(id), listAssignments(id)])
      .then(([mats, asg]) => {
        if (cancelled) return;
        setMaterials(mats);
        setAssignments(asg);
      })
      .catch((e) => { if (!cancelled) setMaterialsError(e instanceof ApiError ? e.message : "Failed to load tasks."); })
      .finally(() => { if (!cancelled) setMaterialsLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  async function reloadAssignments() {
    try {
      setAssignments(await listAssignments(id));
    } catch {
      /* keep the stale list on a transient failure */
    }
  }

  async function handleAssignCrew(userId: string, role: EventRole): Promise<boolean> {
    try {
      await createAssignment(id, userId, role);
      await reloadAssignments();
      toast.success("Crew assigned");
      return true;
    } catch (e) {
      toast.error("Couldn't assign crew", e instanceof ApiError ? e.message : undefined);
      return false;
    }
  }

  async function handleRevoke(a: AssignmentResponse) {
    if (!window.confirm(`Remove ${a.userFullName || a.userEmail} from this event?`)) return;
    try {
      await revokeAssignment(id, a.id);
      setAssignments((prev) => prev.filter((x) => x.id !== a.id));
    } catch (e) {
      toast.error("Couldn't remove crew member", e instanceof ApiError ? e.message : undefined);
    }
  }

  const handlers = assignments.filter((a) => a.eventRole === "HANDLER");
  const managerCount = assignments.filter((a) => a.eventRole === "MANAGER").length;
  const handlerCount = handlers.length;
  // Board "Assign handler" options: only HANDLERs assigned to THIS event — a user must be event
  // crew before tasks can be handed to them, otherwise the task never reaches their My Tasks.
  const assignableUsers: AssigneeOption[] = handlers.map((a) => ({
    id: a.userId,
    fullName: a.userFullName,
    email: a.userEmail,
  }));
  const nameFor = (userId: string | null): string | null => {
    if (!userId) return null;
    const u = users.find((x) => x.id === userId);
    if (u) return u.fullName || u.email;
    const a = assignments.find((x) => x.userId === userId);
    return a ? a.userFullName || a.userEmail : "Unknown user";
  };

  /** Reassign a material's handler (PUT replaces the full request body). */
  async function handleAssign(m: MaterialResponse, userId: string | null) {
    try {
      const updated = await updateMaterial(id, m.id, {
        name: m.name,
        description: m.description,
        quantity: m.quantity,
        catalogItemId: m.catalogItemId,
        assignedTo: userId,
      });
      setMaterials((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
    } catch (e) {
      toast.error("Couldn't assign handler", e instanceof ApiError ? e.message : undefined);
    }
  }

  /** Move a material to another workflow status (state machine enforced server-side). */
  async function handleStatus(m: MaterialResponse, to: MaterialStatus) {
    try {
      const updated = await changeMaterialStatus(m.id, to);
      setMaterials((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Status change failed.";
      toast.error("Couldn't move task", msg);
    }
  }

  async function handleDeleteMaterial(m: MaterialResponse) {
    if (!window.confirm(`Delete task "${m.name}"?`)) return;
    try {
      await deleteMaterial(id, m.id);
      setMaterials((prev) => prev.filter((x) => x.id !== m.id));
    } catch (e) {
      toast.error("Couldn't delete task", e instanceof ApiError ? e.message : undefined);
    }
  }

  /** Create a task from the modal form. Returns true on success (lets the dialog close). */
  async function handleCreateTask(body: MaterialWriteBody): Promise<boolean> {
    try {
      const created = await createMaterial(id, body);
      setMaterials((prev) => [created, ...prev]);
      toast.success("Task created", created.name);
      return true;
    } catch (e) {
      toast.error("Couldn't add task", e instanceof ApiError ? e.message : undefined);
      return false;
    }
  }

  if (loading) {
    return <div className="py-24 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}><Loader2 size={18} className="animate-spin" /> Loading workspace…</div>;
  }
  if (loadError || !event) {
    return <div className="py-24 text-center text-sm" style={{ color: "var(--danger)" }}>{loadError ?? "Event not found."}</div>;
  }

  const isPublic = event.status === "PUBLIC";
  const statusLabel = event.status.charAt(0) + event.status.slice(1).toLowerCase();
  const VIEWS = [
    { id: "board" as const, label: "Board", icon: LayoutGrid },
    { id: "list" as const, label: "List", icon: ListIcon },
    { id: "grid" as const, label: "Grid", icon: Layers },
  ];

  return (
    <div className="flex flex-col gap-5 view-anim">
      <CreateTaskDialog open={addOpen} onOpenChange={setAddOpen} assignees={assignableUsers} onCreate={handleCreateTask} />
      <AssignCrewDialog open={assignOpen} onOpenChange={setAssignOpen} assigned={assignments} canAppointManager={isAdmin} onAssign={handleAssignCrew} />
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          <ChevronLeft size={15} />
          <Link href="/events" className="hover:text-[var(--primary-hex,#6366f1)]">Events</Link>
          <ChevronRight size={14} style={{ color: "var(--text-faint)" }} />
          <span style={{ color: "var(--text-strong)" }}>{event.title}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <Layers size={14} /> Switch event <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px] max-h-[380px] overflow-y-auto p-1.5">
            <div className="flex items-center gap-2 px-2 py-2 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
              <Layers size={14} /> All events
            </div>
            {allEvents.length === 0 ? (
              <div className="px-2 py-2 text-xs" style={{ color: "var(--text-muted)" }}>No events</div>
            ) : (
              allEvents.map((e) => {
                const current = e.id === event.id;
                const gradient = CATEGORY_GRADIENT[(e.category ?? "").toUpperCase()] || CATEGORY_GRADIENT.OTHER;
                return (
                  <DropdownMenuItem
                    key={e.id}
                    onSelect={() => { if (!current) router.push(`/events/${e.id}/workspace`); }}
                    className="gap-3 py-2 rounded-[var(--radius-md)]"
                    style={current ? { background: "var(--primary-soft)" } : undefined}
                  >
                    <span className="shrink-0 w-9 h-9 rounded-[10px]" style={{ background: gradient }} />
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-sm font-bold truncate" style={{ color: current ? "var(--primary-hex,#6366f1)" : "var(--text-strong)" }}>{e.title}</span>
                      <span className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                        {formatDate(e.startsAt)} · {e.status.charAt(0) + e.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                    {current && <Check size={16} className="shrink-0" style={{ color: "var(--primary-hex,#6366f1)" }} />}
                  </DropdownMenuItem>
                );
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Banner + tabs card */}
      <div className="rounded-[var(--radius-xl)] overflow-hidden border" style={{ borderColor: "var(--border-hex,#ecedf4)", boxShadow: "var(--shadow-card)" }}>
        {/* Banner */}
        <div className="relative px-8 py-8 text-white" style={bannerStyle(event)}>
          <Calendar size={68} strokeWidth={1.25} className="absolute top-7 right-8 opacity-25" />
          <p className="text-[11px] font-extrabold tracking-[0.16em] uppercase m-0 opacity-85">Managing event</p>
          <h1 className="text-[30px] font-extrabold m-0 mt-1.5 leading-tight">{event.title}</h1>
          <div className="flex items-center gap-3 mt-3.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={isPublic ? { background: "rgba(255,255,255,0.92)", color: "var(--green-600)" } : { background: "rgba(0,0,0,0.28)", color: "#fff" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: isPublic ? "var(--green-600)" : "#fff" }} /> {isPublic ? "Public" : statusLabel}
            </span>
            <span className="text-sm font-semibold opacity-95">
              {formatDate(event.startsAt)}{event.venue ? ` · ${event.venue}` : ""}
            </span>
          </div>
        </div>

        {/* Tabs + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5" style={{ background: "var(--surface)" }}>
          <div className="flex items-center gap-1 p-1 rounded-[var(--radius-md)]" style={{ background: "var(--surface-2)" }}>
            {TABS.map((t) => {
              const active = t.id === tab;
              return (
                <button
                  key={t.id}
                  onClick={() => selectTab(t.id)}
                  className="inline-flex items-center gap-1.5 text-sm font-bold px-3.5 py-2 rounded-[var(--radius-sm)] cursor-pointer transition-all whitespace-nowrap"
                  style={{
                    background: active ? "var(--surface)" : "transparent",
                    border: active ? "1px solid var(--border-hex,#ecedf4)" : "1px solid transparent",
                    boxShadow: active ? "var(--shadow-sm)" : "none",
                    color: active ? "var(--primary-hex,#6366f1)" : "var(--text-muted)",
                  }}
                >
                  <t.icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm"><Eye size={14} /> Public page</Button>
            <Button asChild variant="ghost" size="sm"><Link href={`/events/${event.id}/edit`}><Pencil size={14} /> Edit</Link></Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} className="hover:bg-[var(--danger-soft)]" style={{ color: "var(--danger)" }}><Trash2 size={14} /> Delete</Button>
          </div>
        </div>
      </div>

      {/* ── Tab content (separate cards) ── */}
      {tab === "materials" && (
        <Card>
          <CardContent className="p-6 flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold m-0" style={{ color: "var(--text-strong)" }}>Material &amp; Task Delegation</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 p-1 rounded-[var(--radius-md)]" style={{ background: "var(--surface-2)" }}>
                  {VIEWS.map((v) => {
                    const active = v.id === view;
                    return (
                      <button key={v.id} onClick={() => setView(v.id)} className="inline-flex items-center gap-1.5 text-[13px] font-bold px-2.5 py-1.5 rounded-[var(--radius-sm)] cursor-pointer transition-all"
                        style={{ background: active ? "var(--surface)" : "transparent", boxShadow: active ? "var(--shadow-sm)" : "none", color: active ? "var(--primary-hex,#6366f1)" : "var(--text-muted)", border: "none" }}>
                        <v.icon size={14} /> {v.label}
                      </button>
                    );
                  })}
                </div>
                <Button variant="soft" size="sm" onClick={() => setAddOpen(true)}><Plus size={14} /> Add task</Button>
              </div>
            </div>

            {view === "board" && (
              materialsLoading ? (
                <div className="py-16 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={18} className="animate-spin" /> Loading tasks…
                </div>
              ) : materialsError ? (
                <div className="py-16 text-center text-sm" style={{ color: "var(--danger)" }}>{materialsError}</div>
              ) : (
              <div className="flex gap-4 overflow-x-auto pb-1">
                {STATUS_COLUMNS.map((col) => {
                  const items = materials.filter((m) => m.status === col.status);
                  return (
                    <div key={col.status} className="flex flex-col gap-3 flex-shrink-0 rounded-[var(--radius-lg)] p-3" style={{ width: 280, background: "var(--surface-2)" }}>
                      <div className="flex items-center justify-between px-1 pt-1">
                        <span className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: "var(--text-strong)" }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: col.dot }} /> {col.label}
                        </span>
                        <span className="text-xs font-bold" style={{ color: "var(--text-faint)" }}>{items.length}</span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {items.map((m) => (
                          <MaterialCard
                            key={m.id}
                            m={m}
                            assignees={assignableUsers}
                            nameFor={nameFor}
                            onAssign={handleAssign}
                            onStatus={handleStatus}
                            onDelete={handleDeleteMaterial}
                          />
                        ))}
                        {items.length === 0 && (
                          <span className="text-xs px-1 py-2" style={{ color: "var(--text-faint)" }}>No tasks</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )
            )}

            {view === "list" && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" style={{ minWidth: 820 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-hex,#ecedf4)" }}>
                      {["Task", "Priority", "Category", "Handler", "Due", "Status"].map((h) => (
                        <th key={h} className="text-left text-[13px] font-semibold px-3 py-3 first:pl-0" style={{ color: "var(--text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TASKS.map((t, i) => (
                      <tr key={t.id} className="transition-colors hover:bg-[var(--surface-2)]" style={{ borderBottom: i === TASKS.length - 1 ? "none" : "1px solid var(--border-hex,#ecedf4)" }}>
                        <td className="px-3 py-4 first:pl-0">
                          <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{t.title}</span>
                        </td>
                        <td className="px-3 py-4">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: PRIORITY[t.priority].bg, color: PRIORITY[t.priority].color }}>{t.priority}</span>
                        </td>
                        <td className="px-3 py-4">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>{t.category}</span>
                        </td>
                        <td className="px-3 py-4">
                          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-2.5 py-1.5 rounded-[var(--radius-sm)] border" style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }}>
                            <AvatarUser name={t.assignee} size={18} /> {t.assignee} <ChevronDown size={13} style={{ color: "var(--text-faint)" }} />
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-[13px]">
                          <span style={{ color: "var(--text-muted)" }}>{t.due}</span>
                          {t.time && <span style={{ color: "var(--text-faint)" }}>, {t.time}</span>}
                        </td>
                        <td className="px-3 py-4">
                          <span className="inline-flex items-center justify-between gap-2 text-[13px] font-semibold px-3 py-1.5 rounded-[var(--radius-sm)] border" style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)", minWidth: 132 }}>
                            {COL_LABEL[t.col] ?? t.col} <ChevronDown size={13} style={{ color: "var(--text-faint)" }} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {view === "grid" && <TaskGrid />}

            <p className="text-xs m-0" style={{ color: "var(--text-faint)" }}>The Board is live (assign, move, add &amp; delete persist to the backend). List and Grid views are still placeholder.</p>
          </CardContent>
        </Card>
      )}

      {tab === "guests" && <GuestsTab eventId={id} />}
      {tab === "agenda" && <AgendaTab eventId={id} eventDate={event.startsAt} />}

      {tab === "details" && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
          {/* Event details (read-only) */}
          <Card>
            <CardContent className="p-6 flex flex-col gap-5">
              <h2 className="text-xl font-bold m-0" style={{ color: "var(--text-strong)" }}>Event Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Event name" value={event.title} />
                <Field label="Category" value={event.category ? event.category.charAt(0) + event.category.slice(1).toLowerCase() : "—"} />
                <Field label="Date" value={formatDate(event.startsAt)} />
                <Field label="Capacity" value={event.capacity != null ? event.capacity.toLocaleString() : "Uncapped"} />
              </div>
              <Field label="Venue" value={event.venue ?? "—"} />
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-bold" style={{ color: "var(--text-strong)" }}>Description</span>
                <div className="min-h-[88px] px-3.5 py-3 rounded-[var(--radius-md)] border text-sm leading-relaxed" style={{ background: "var(--surface-2)", borderColor: "var(--border-hex,#ecedf4)", color: event.description ? "var(--text)" : "var(--text-faint)" }}>
                  {event.description || "No description."}
                </div>
              </div>
              <div className="pt-1">
                <Button asChild variant="ghost" size="sm"><Link href={`/events/${event.id}/edit`}><Pencil size={14} /> Edit details</Link></Button>
              </div>
            </CardContent>
          </Card>

          {/* Crew assigned */}
          <Card>
            <CardContent className="p-6 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="text-xl font-bold m-0" style={{ color: "var(--text-strong)" }}>Crew Assigned</h2>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-full" style={{ background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)" }}>{managerCount} {managerCount === 1 ? "Manager" : "Managers"}</span>
                  <span className="px-2.5 py-1 rounded-full" style={{ background: "var(--teal-soft)", color: "var(--teal)" }}>{handlerCount} {handlerCount === 1 ? "Handler" : "Handlers"}</span>
                </div>
              </div>
              {assignments.length === 0 && !materialsLoading && (
                <p className="text-sm py-2 m-0" style={{ color: "var(--text-muted)" }}>No crew assigned yet.</p>
              )}
              {assignments.map((a, i) => {
                const display = a.userFullName || a.userEmail;
                const isManager = a.eventRole === "MANAGER";
                return (
                  <div key={a.id} className="flex items-center gap-3 py-3" style={{ borderBottom: i === assignments.length - 1 ? "none" : "1px solid var(--border-hex,#ecedf4)" }}>
                    <AvatarUser name={display} size={40} />
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span className="text-sm font-bold truncate" style={{ color: "var(--text-strong)" }}>{display}</span>
                      <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{a.userEmail}</span>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={isManager ? { background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)" } : { background: "var(--teal-soft)", color: "var(--teal)" }}>
                      {isManager ? "Manager" : "Handler"}
                    </span>
                    <button onClick={() => handleRevoke(a)} title="Remove from event" className="p-1.5 rounded cursor-pointer hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]" style={{ background: "none", border: "none", color: "var(--text-faint)" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              <button onClick={() => setAssignOpen(true)} className="mt-2 flex items-center justify-center gap-1.5 w-full h-[44px] rounded-[var(--radius-md)] text-sm font-bold cursor-pointer transition-colors hover:brightness-95" style={{ background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)", border: "none" }}>
                <Plus size={15} /> Assign crew
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Materials Grid (editable, spreadsheet-style) ──────────────────────────────
interface GridRow { id: string; title: string; category: string; assignee: string; due: string; priority: Priority; status: string }
const GRID_SEED: GridRow[] = [
  { id: "1",  title: "Stage truss + lighting rig setup", category: "Production", assignee: "Ava Nguyen",  due: "Jun 24, 8:00", priority: "high", status: "done" },
  { id: "2",  title: "Registration desk signage print",  category: "Print",      assignee: "Ava Nguyen",  due: "Jun 22",       priority: "med",  status: "done" },
  { id: "3",  title: "Speaker green-room catering",       category: "Catering",   assignee: "Noah Pierce", due: "Jun 24, 9:00", priority: "med",  status: "pending" },
  { id: "4",  title: "AV soundcheck — main hall",         category: "Production", assignee: "Liam Carter", due: "Jun 24, 7:00", priority: "high", status: "review" },
  { id: "5",  title: "Sponsor booth kit distribution",    category: "Logistics",  assignee: "Mia Rossi",   due: "Jun 23",       priority: "low",  status: "inprogress" },
  { id: "6",  title: "Wi-Fi access points QA sweep",      category: "IT",         assignee: "Noah Pierce", due: "Jun 23",       priority: "high", status: "issues" },
  { id: "7",  title: "Lanyards + badge stock count",      category: "Logistics",  assignee: "Ava Nguyen",  due: "Jun 21",       priority: "low",  status: "done" },
  { id: "8",  title: "Volunteer briefing packets",        category: "Ops",        assignee: "Mia Rossi",   due: "Jun 23",       priority: "med",  status: "pending" },
  { id: "9",  title: "Photographer call-sheet",           category: "Media",      assignee: "Liam Carter", due: "Jun 24",       priority: "low",  status: "pending" },
  { id: "10", title: "Backstage power distribution",      category: "Production", assignee: "Liam Carter", due: "Jun 24, 6:00", priority: "high", status: "review" },
];

function CellInput({ value, onChange, className, style, placeholder }: { value: string; onChange: (v: string) => void; className?: string; style?: React.CSSProperties; placeholder?: string }) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`bg-transparent border-none outline-none focus:bg-[var(--surface-2)] rounded-[var(--radius-sm)] px-1.5 -mx-1 py-1 transition-colors ${className ?? ""}`}
      style={style}
    />
  );
}

function TaskGrid() {
  const [rows, setRows] = useState<GridRow[]>(GRID_SEED);

  function patch(id: string, key: keyof GridRow, val: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: val } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { id: String(Date.now()), title: "", category: "Ops", assignee: "Unassigned", due: "", priority: "med", status: "pending" }]);
  }
  function remove(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[13px]" style={{ color: "var(--text-faint)" }}>
          <span className="flex items-center justify-center w-6 h-6 rounded-full" style={{ background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)" }}><Sparkles size={13} /></span>
          Click any cell to edit. Add rows like a spreadsheet.
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}><Layers size={13} /> {rows.length} rows</span>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-md)] border" style={{ borderColor: "var(--border-hex,#ecedf4)" }}>
        <table className="w-full border-collapse" style={{ minWidth: 1000 }}>
          <thead>
            <tr style={{ background: "var(--primary-soft)" }}>
              {["#", "Task / Material", "Category", "Handler", "Due", "Priority", "Status", ""].map((h) => (
                <th key={h} className="text-left text-[11px] font-bold uppercase tracking-wider px-4 py-3" style={{ color: "var(--primary-hex,#6366f1)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const ss = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending;
              const ps = PRIORITY[r.priority];
              const cs = catStyle(r.category);
              return (
                <tr key={r.id} className="group" style={{ borderTop: i === 0 ? "none" : "1px solid var(--border-hex,#ecedf4)" }}>
                  <td className="px-4 py-2.5 text-[13px] font-bold align-middle" style={{ color: "var(--text-faint)", borderLeft: `4px solid ${ss.color}` }}>{String(i + 1).padStart(2, "0")}</td>
                  <td className="px-3 py-2.5 align-middle">
                    <CellInput value={r.title} onChange={(v) => patch(r.id, "title", v)} placeholder="Task name…" className="w-full text-sm font-bold" style={{ color: "var(--text-strong)" }} />
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <CellInput value={r.category} onChange={(v) => patch(r.id, "category", v)} className="text-xs font-bold text-center w-[112px]" style={{ background: cs.bg, color: cs.color, borderRadius: "var(--radius-sm)", paddingTop: 4, paddingBottom: 4 }} />
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <span className="inline-flex items-center gap-2">
                      <AvatarUser name={r.assignee || "?"} hue={hueForName(r.assignee)} size={24} />
                      <CellInput value={r.assignee} onChange={(v) => patch(r.id, "assignee", v)} className="text-[13px] font-semibold w-[100px]" style={{ color: "var(--text)" }} />
                    </span>
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <CellInput value={r.due} onChange={(v) => patch(r.id, "due", v)} placeholder="Date" className="text-[13px] w-[96px]" style={{ color: "var(--text-muted)" }} />
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1.5 rounded-[var(--radius-sm)] cursor-pointer" style={{ background: ps.bg, color: ps.color, border: "none" }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: ps.color }} /> {PRIO_LABEL[r.priority]} <ChevronDown size={12} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {PRIORITIES.map((p) => (
                          <DropdownMenuItem key={p} onSelect={() => patch(r.id, "priority", p)}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY[p].color }} /> {PRIO_LABEL[p]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1.5 rounded-[var(--radius-sm)] cursor-pointer" style={{ background: ss.bg, color: ss.color, border: "none", minWidth: 116 }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ss.color }} /> <span className="flex-1 text-left">{COL_LABEL[r.status] ?? r.status}</span> <ChevronDown size={12} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {STATUS_KEYS.map((s) => (
                          <DropdownMenuItem key={s} onSelect={() => patch(r.id, "status", s)}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_STYLE[s].color }} /> {COL_LABEL[s]}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="px-3 py-2.5 text-right align-middle">
                    <Button variant="ghost" size="icon-sm" className="opacity-50 group-hover:opacity-100 hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]" title="Delete row" onClick={() => remove(r.id)}><Trash2 size={14} /></Button>
                  </td>
                </tr>
              );
            })}
            <tr style={{ borderTop: "1px solid var(--border-hex,#ecedf4)" }}>
              <td colSpan={8} className="px-4 py-3 text-center" style={{ background: "var(--surface-2)" }}>
                <button onClick={addRow} className="inline-flex items-center gap-1.5 text-sm font-bold cursor-pointer" style={{ color: "var(--primary-hex,#6366f1)", background: "none", border: "none" }}>
                  <Plus size={15} /> Add row
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Guests tab (live attendance — backed by the attendance API) ──────────────
/** Stable avatar hue derived from the guest's name/email. */
function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

const GUEST_STATUS_COLOR: Record<TicketStatus, string> = {
  PENDING: "var(--text-muted)",
  DELIVERED: "var(--blue)",
  CHECKED_IN: "var(--green-600)",
  REVOKED: "var(--danger)",
};

function StatCard({ icon, bg, color, value, label }: { icon: React.ReactNode; bg: string; color: string; value: string; label: string }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <span className="flex items-center justify-center w-11 h-11 rounded-[var(--radius-md)] flex-shrink-0" style={{ background: bg, color }}>{icon}</span>
        <div className="flex flex-col">
          <span className="text-2xl font-extrabold leading-none" style={{ color: "var(--text-strong)" }}>{value}</span>
          <span className="text-sm font-semibold mt-1" style={{ color: "var(--text-muted)" }}>{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function GuestsTab({ eventId }: { eventId: string }) {
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [checkinTimes, setCheckinTimes] = useState<Record<string, string>>({});
  // Authoritative roll-up from the attendance summary — the guest list is capped at 100 rows,
  // so the stat cards must use these server totals, not submissions.length, to stay accurate.
  const [totals, setTotals] = useState({ registered: 0, checkedIn: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Guest list + the confirmed-check-in timestamps for the "Time" column.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([listSubmissions(eventId), getAttendance(eventId)])
      .then(([subs, att]) => {
        if (cancelled) return;
        setSubmissions(subs);
        setTotals({ registered: att.totalRegistered, checkedIn: att.totalCheckedIn });
        const times: Record<string, string> = {};
        for (const c of att.checkins) times[c.submissionId] = c.checkedInAt;
        setCheckinTimes(times);
      })
      .catch((e) => { if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load guests."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [eventId]);

  const { registered, checkedIn } = totals;
  const awaiting = Math.max(0, registered - checkedIn);
  const onSite = registered ? Math.round((checkedIn / registered) * 100) : 0;

  const q = search.trim().toLowerCase();
  const visible = submissions.filter(
    (g) => !q || (g.guestName ?? "").toLowerCase().includes(q) || g.guestEmail.toLowerCase().includes(q),
  );

  function fmtTime(iso?: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  /** Mark a row checked-in and bump the live count (the button only shows for awaiting guests). */
  function markCheckedIn(g: SubmissionSummary, at?: string) {
    setSubmissions((prev) => prev.map((x) => (x.id === g.id ? { ...x, qrStatus: "CHECKED_IN" } : x)));
    if (at) setCheckinTimes((prev) => ({ ...prev, [g.id]: at }));
    setTotals((t) => ({ ...t, checkedIn: t.checkedIn + 1 }));
  }

  async function checkIn(g: SubmissionSummary) {
    setBusyId(g.id);
    try {
      const res = await manualCheckin(eventId, g.id);
      markCheckedIn(g, res.checkedInAt);
      toast.success("Guest checked in", g.guestName ?? g.guestEmail);
    } catch (e) {
      // A concurrent scan already checked them in — that's the idempotent success path
      // (CLAUDE.md gotcha #4), not a failure. Reconcile and report it as such.
      if (e instanceof ApiError && e.code === "ALREADY_CHECKED_IN") {
        markCheckedIn(g);
        toast.success("Already checked in", g.guestName ?? g.guestEmail);
        return;
      }
      toast.error("Couldn't check in guest", e instanceof ApiError ? e.message : undefined);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <Card>
        <CardContent className="p-10 flex flex-col items-center gap-2 text-center">
          <AlertTriangle size={22} style={{ color: "var(--danger)" }} />
          <p className="text-sm font-semibold m-0" style={{ color: "var(--text-strong)" }}>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<Users size={20} />}       bg="var(--blue-soft)"    color="var(--blue)"       value={String(registered)} label="Registered" />
        <StatCard icon={<CheckCircle2 size={20} />} bg="var(--green-soft)"   color="var(--green-600)"  value={String(checkedIn)}  label="Checked-in" />
        <StatCard icon={<Radio size={20} />}        bg="var(--violet-soft)"  color="var(--violet)"     value={`${onSite}%`}       label="On-site" />
        <StatCard icon={<Clock size={20} />}        bg="var(--orange-soft)"  color="var(--orange)"     value={String(awaiting)}   label="Awaiting" />
      </div>

      {/* Attendance tracker */}
      <Card>
        <CardContent className="p-6 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold m-0" style={{ color: "var(--text-strong)" }}>Attendance Tracker</h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--green-soft)", color: "var(--green-600)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--green-600)" }} /> Live
              </span>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
              <input
                type="search"
                placeholder="Search guests…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[230px] h-[40px] pl-9 pr-3.5 rounded-[var(--radius-md)] border text-sm font-semibold focus:outline-none focus:border-[var(--primary-hex,#6366f1)]"
                style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 820 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-hex,#ecedf4)" }}>
                  {["Guest", "Phone", "Status", "Time", "Check-in"].map((h, i) => (
                    <th key={h} className={`text-[13px] font-semibold px-3 py-3 first:pl-0 ${i === 4 ? "text-right" : "text-left"}`} style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((g, i) => {
                  const name = g.guestName ?? g.guestEmail;
                  const isCheckedIn = g.qrStatus === "CHECKED_IN";
                  const isRevoked = g.qrStatus === "REVOKED";
                  return (
                  <tr key={g.id} className="transition-colors hover:bg-[var(--surface-2)]" style={{ borderBottom: i === visible.length - 1 ? "none" : "1px solid var(--border-hex,#ecedf4)" }}>
                    <td className="px-3 py-3.5 first:pl-0">
                      <div className="flex items-center gap-3">
                        <AvatarUser name={name} hue={hashHue(g.guestEmail)} size={36} />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{name}</span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{g.guestEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-sm whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{g.guestPhone || "—"}</td>
                    <td className="px-3 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: GUEST_STATUS_COLOR[g.qrStatus] }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: GUEST_STATUS_COLOR[g.qrStatus] }} /> {TICKET_STATUS_LABEL[g.qrStatus]}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-[13px] whitespace-nowrap" style={{ color: "var(--text-faint)" }}>{fmtTime(checkinTimes[g.id])}</td>
                    <td className="px-3 py-3.5 text-right">
                      {isCheckedIn ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: "var(--green-600)" }}><Check size={14} /> Checked in</span>
                      ) : isRevoked ? (
                        <span className="text-[13px]" style={{ color: "var(--text-faint)" }}>—</span>
                      ) : (
                        <Button variant="soft" size="sm" disabled={busyId === g.id} onClick={() => checkIn(g)}>
                          {busyId === g.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Check in
                        </Button>
                      )}
                    </td>
                  </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>{submissions.length === 0 ? "No guests have registered yet." : "No guests match your search."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Agenda tab (run-of-show — backed by the agenda API) ──────────────────────
/** Add or edit a single run-of-show session. */
function AgendaSessionDialog({
  open, onOpenChange, initial, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: AgendaItem | null;
  onSave: (input: AgendaItemInput) => Promise<boolean>;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [mins, setMins] = useState("60");
  const [submitting, setSubmitting] = useState(false);
  const editing = initial != null;

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setTime(initial?.time || "09:00");
      setMins(initial != null ? String(initial.mins) : "60");
      setSubmitting(false);
    }
  }, [open, initial]);

  const canSubmit = title.trim().length > 0 && /^\d{2}:\d{2}$/.test(time) && !submitting;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const ok = await onSave({ title: title.trim(), time, mins: Number(mins) || 0 });
    setSubmitting(false);
    if (ok) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-11 h-11 rounded-[var(--radius-md)]" style={{ background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)" }}>
              <Clock size={20} />
            </span>
            <div className="flex flex-col gap-0.5">
              <DialogTitle>{editing ? "Edit session" : "Add session"}</DialogTitle>
              <DialogDescription>A slot in the event&apos;s run of show</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agenda-title">Title <span style={{ color: "var(--danger)" }}>*</span></Label>
            <Input id="agenda-title" value={title} maxLength={200} autoFocus
              placeholder="e.g. Opening Keynote"
              onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agenda-time">Start time</Label>
              <Input id="agenda-time" type="time" value={time}
                onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agenda-mins">Duration (min)</Label>
              <Input id="agenda-mins" type="number" min={0} step={5} value={mins}
                placeholder="60"
                onChange={(e) => setMins(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="default">Cancel</Button>
            </DialogClose>
            <Button type="submit" size="default" disabled={!canSubmit}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : editing ? <Check size={14} /> : <Plus size={14} />}
              {editing ? "Save changes" : "Add session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AgendaTab({ eventId, eventDate }: { eventId: string; eventDate: string | null }) {
  const [sessions, setSessions] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AgendaItem | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AgendaItem | null>(null);

  const reload = useCallback(
    (signal?: AbortSignal) =>
      listAgenda(eventId, signal)
        .then((items) => setSessions(items))
        .catch((e) => { if (!signal?.aborted) setError(e instanceof ApiError ? e.message : "Failed to load agenda."); }),
    [eventId]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    reload(ctrl.signal).finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [reload]);

  function openAdd() { setEditing(null); setDialogOpen(true); }
  function openEdit(item: AgendaItem) { setEditing(item); setDialogOpen(true); }

  async function handleSave(input: AgendaItemInput): Promise<boolean> {
    try {
      if (editing) {
        await updateAgendaItem(eventId, editing.id, input, eventDate ?? undefined);
        toast.success("Session updated");
      } else {
        await createAgendaItem(eventId, input, eventDate ?? undefined);
        toast.success("Session added");
      }
      await reload();
      return true;
    } catch (e) {
      toast.error(editing ? "Couldn't update session" : "Couldn't add session", e instanceof ApiError ? e.message : undefined);
      return false;
    }
  }

  async function confirmDelete() {
    const item = confirmTarget;
    if (!item) return;
    try {
      await deleteAgendaItem(eventId, item.id);
      setSessions((prev) => prev.filter((s) => s.id !== item.id));
      toast.success("Session deleted");
    } catch (e) {
      toast.error("Couldn't delete session", e instanceof ApiError ? e.message : undefined);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: "var(--text-muted)" }}>
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <Card>
        <CardContent className="p-10 flex flex-col items-center gap-2 text-center">
          <AlertTriangle size={22} style={{ color: "var(--danger)" }} />
          <p className="text-sm font-semibold m-0" style={{ color: "var(--text-strong)" }}>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold m-0" style={{ color: "var(--text-strong)" }}>Run of Show</h2>
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-semibold" style={{ color: "var(--text-faint)" }}>{sessions.length} sessions</span>
            <Button variant="soft" size="sm" onClick={openAdd}><Plus size={14} /> Add session</Button>
          </div>
        </div>

        <AgendaSessionDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editing} onSave={handleSave} />
        <ConfirmDialog
          open={confirmTarget != null}
          onOpenChange={(v) => { if (!v) setConfirmTarget(null); }}
          title="Delete session?"
          description={confirmTarget ? `"${confirmTarget.title}" will be removed from the run of show.` : undefined}
          confirmLabel="Delete"
          destructive
          onConfirm={confirmDelete}
        />

        {sessions.length === 0 ? (
          <p className="py-10 text-center text-sm m-0" style={{ color: "var(--text-muted)" }}>No sessions scheduled yet.</p>
        ) : (
        <div className="flex flex-col">
          {sessions.map((s, i) => {
            const st = AGENDA_TYPE_STYLE[s.type];
            const last = i === sessions.length - 1;
            return (
              <div key={s.id} className="flex gap-3" style={{ paddingBottom: last ? 0 : 18 }}>
                {/* Time */}
                <div className="w-[60px] text-right pt-1 flex-shrink-0">
                  <div className="text-sm font-extrabold" style={{ color: "var(--text-strong)" }}>{s.time}</div>
                  <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>{s.mins} min</div>
                </div>
                {/* Rail */}
                <div className="relative w-5 flex justify-center flex-shrink-0">
                  {!last && <span className="absolute w-px" style={{ top: 10, bottom: -18, background: "var(--border-hex,#ecedf4)" }} />}
                  <span className="relative z-10 mt-1 flex items-center justify-center rounded-full" style={{ width: 16, height: 16, border: `2px solid ${st.accent}`, background: "var(--surface)" }}>
                    <span className="rounded-full" style={{ width: 6, height: 6, background: st.accent }} />
                  </span>
                </div>
                {/* Card */}
                <div className="flex-1 flex items-center gap-3 rounded-[var(--radius-md)] border py-3 pr-3 pl-4" style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)", borderLeft: `4px solid ${st.accent}` }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>{s.title}</div>
                    <div className="inline-flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--text-muted)" }}><MapPin size={12} /> {s.location}</div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: st.chipBg, color: st.chipColor }}>{st.label}</span>
                  {s.staff.length > 0 && (
                    <div className="flex -space-x-1.5">
                      {s.staff.map((p, j) => (
                        <span key={j} className="rounded-full" style={{ boxShadow: "0 0 0 2px var(--surface)" }}><AvatarUser name={p.name} hue={p.hue} size={24} /></span>
                      ))}
                    </div>
                  )}
                  <Button variant="ghost" size="icon-sm" title="Edit session" onClick={() => openEdit(s)}><Pencil size={14} /></Button>
                  <Button variant="ghost" size="icon-sm" title="Remove session" onClick={() => setConfirmTarget(s)} className="hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"><Trash2 size={14} /></Button>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Read-only labelled field that looks like a disabled input. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-bold" style={{ color: "var(--text-strong)" }}>{label}</span>
      <div className="h-[44px] flex items-center px-3.5 rounded-[var(--radius-md)] border text-sm" style={{ background: "var(--surface-2)", borderColor: "var(--border-hex,#ecedf4)", color: "var(--text)" }}>
        {value}
      </div>
    </div>
  );
}

