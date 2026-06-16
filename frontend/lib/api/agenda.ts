/**
 * Agenda (run-of-show) surface — wraps the backend `AgendaController`:
 *   GET    /events/{eventId}/agenda           list the event's agenda items (canView)
 *   POST   /events/{eventId}/agenda           add a session, appended to the end (canManage)
 *   PUT    /events/{eventId}/agenda/{itemId}  edit a session's title/timing (canManage)
 *   DELETE /events/{eventId}/agenda/{itemId}  remove a session (canManage)
 *
 * The backend `agenda_item` table only carries `title`, `startsAt`, `endsAt`, `position`
 * (see `docs/02-database-schema.md` §3.8). The timeline UI wants `time`/`mins` plus a few
 * display-only fields (`location`, `type`, `staff`) the schema doesn't store — so this module
 * maps the raw backend rows into the UI shape, deriving `time`/`mins` from the timestamps and
 * giving the non-schema fields sensible client-side defaults. Keeping the map here means the
 * `AgendaTab` component and `AgendaItem` type never have to know the backend shape.
 */
import { apiFetch } from './client'

/** Kind of agenda slot — drives the timeline accent + chip. */
export type AgendaItemType = 'ops' | 'mainstage' | 'workshop' | 'break'

/** A staff member shown on a session card. */
export interface AgendaStaff {
  name: string
  hue: number
}

/** One run-of-show slot, in the shape the timeline UI renders. */
export interface AgendaItem {
  id: string
  /** Start time, `HH:mm`. */
  time: string
  /** Duration in minutes. */
  mins: number
  title: string
  location: string
  type: AgendaItemType
  staff: AgendaStaff[]
}

/** Raw agenda row as returned by the backend `AgendaItemResponse`. */
interface AgendaItemResponse {
  id: string
  eventId: string
  title: string
  /** ISO-8601 instant, or null if the slot isn't time-pinned yet. */
  startsAt: string | null
  endsAt: string | null
  position: number
  createdAt: string
  updatedAt: string
}

/** Format an ISO instant as 24-hour `HH:mm` in the viewer's local time; `''` when absent. */
function toClockTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Minutes between start and end; 0 when either bound is missing/invalid. */
function durationMins(startIso: string | null, endIso: string | null): number {
  if (!startIso || !endIso) return 0
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0
  return Math.round((end - start) / 60000)
}

/**
 * Infer a display type from the title, since the backend doesn't store one. Purely cosmetic —
 * drives the timeline accent colour and chip label.
 */
function inferType(title: string): AgendaItemType {
  const t = title.toLowerCase()
  if (/\b(break|lunch|coffee|tea|recess)\b/.test(t)) return 'break'
  if (/\b(workshop|lab|breakout|hands-on)\b/.test(t)) return 'workshop'
  if (/\b(keynote|panel|opening|closing|plenary|main\s*stage)\b/.test(t)) return 'mainstage'
  return 'ops'
}

/**
 * Order agenda rows chronologically by start time. The backend returns them in `position`
 * (insertion) order, but the timeline reads as a schedule, so it must run earliest-first.
 * Rows without a start time sort to the end; ties fall back to `position` for a stable order.
 */
function byStartTime(a: AgendaItemResponse, b: AgendaItemResponse): number {
  const ta = a.startsAt ? new Date(a.startsAt).getTime() : Number.POSITIVE_INFINITY
  const tb = b.startsAt ? new Date(b.startsAt).getTime() : Number.POSITIVE_INFINITY
  if (ta !== tb) return ta - tb
  return a.position - b.position
}

/** Map a raw backend row to the timeline UI shape. */
function toAgendaItem(r: AgendaItemResponse): AgendaItem {
  return {
    id: r.id,
    time: toClockTime(r.startsAt),
    mins: durationMins(r.startsAt, r.endsAt),
    title: r.title,
    // Fields the backend schema doesn't carry — display-only client defaults.
    location: 'TBD',
    type: inferType(r.title),
    staff: [],
  }
}

/**
 * List an event's run-of-show, ordered by the backend `position`. Throws `ApiError` on a
 * non-2xx response (e.g. 403 if the viewer can't see the event); `AgendaTab` renders that.
 */
export async function listAgenda(eventId: string, signal?: AbortSignal): Promise<AgendaItem[]> {
  const rows = await apiFetch<AgendaItemResponse[]>(`/events/${eventId}/agenda`, { signal })
  return [...rows].sort(byStartTime).map(toAgendaItem)
}

/** What an add/edit form collects — the only fields the backend persists. */
export interface AgendaItemInput {
  title: string
  /** Start clock time, `HH:mm`. */
  time: string
  /** Duration in minutes. */
  mins: number
}

/**
 * Build the backend `{ startsAt, endsAt }` from a base day, a clock time and a duration. The UI
 * only ever shows `HH:mm`, but the column is `timestamptz`, so we anchor the time to the event's
 * date (falling back to today) and derive `endsAt` from the duration. Times are interpreted in the
 * viewer's local zone — symmetric with `toClockTime`, so a value round-trips unchanged.
 */
function toRequestBody(input: AgendaItemInput, baseDayIso: string | undefined) {
  const base = baseDayIso ? new Date(baseDayIso) : new Date()
  const [h, m] = input.time.split(':').map((n) => Number(n))
  const start = new Date(base)
  start.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0)
  const end = new Date(start.getTime() + Math.max(0, input.mins) * 60000)
  return {
    title: input.title.trim(),
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
  }
}

/** Add a session to an event's run-of-show (appended at the end). Returns the created item. */
export async function createAgendaItem(
  eventId: string,
  input: AgendaItemInput,
  baseDayIso?: string
): Promise<AgendaItem> {
  const row = await apiFetch<AgendaItemResponse>(`/events/${eventId}/agenda`, {
    method: 'POST',
    body: toRequestBody(input, baseDayIso),
  })
  return toAgendaItem(row)
}

/** Edit a session's title/timing. Returns the updated item. */
export async function updateAgendaItem(
  eventId: string,
  itemId: string,
  input: AgendaItemInput,
  baseDayIso?: string
): Promise<AgendaItem> {
  const row = await apiFetch<AgendaItemResponse>(`/events/${eventId}/agenda/${itemId}`, {
    method: 'PUT',
    body: toRequestBody(input, baseDayIso),
  })
  return toAgendaItem(row)
}

/** Remove a session from an event's run-of-show. */
export function deleteAgendaItem(eventId: string, itemId: string): Promise<void> {
  return apiFetch<void>(`/events/${eventId}/agenda/${itemId}`, { method: 'DELETE' })
}

export const AGENDA_TYPE_STYLE: Record<
  AgendaItemType,
  { label: string; chipBg: string; chipColor: string; accent: string }
> = {
  ops: {
    label: 'Ops',
    chipBg: 'var(--surface-3)',
    chipColor: 'var(--text-muted)',
    accent: '#9aa0b5',
  },
  mainstage: {
    label: 'Main Stage',
    chipBg: 'var(--primary-soft)',
    chipColor: 'var(--primary-hex,#6366f1)',
    accent: 'var(--primary-hex,#6366f1)',
  },
  workshop: {
    label: 'Workshop',
    chipBg: 'var(--violet-soft)',
    chipColor: 'var(--violet)',
    accent: 'var(--violet)',
  },
  break: {
    label: 'Break',
    chipBg: 'var(--green-soft)',
    chipColor: 'var(--green-600)',
    accent: 'var(--green-600)',
  },
}
