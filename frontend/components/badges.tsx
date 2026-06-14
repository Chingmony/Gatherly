import type { MaterialStatus, EventStatus, GuestStatus } from '@/lib/api'
import { SM, eventStatusStyle, GUEST_ST } from '@/lib/status'
import { Badge } from '@/components/ui/badge'

/**
 * Domain status pills. They compose the shared <Badge> primitive for shape and
 * apply the data-driven status colors (from lib/status) via inline style, since
 * the palette is dynamic per status rather than a fixed CVA variant set. Color
 * is always paired with the text label (a11y — never color alone).
 */
function Dot({ color }: { color: string }) {
  return (
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
  )
}

export function MatBadge({ s, sm = false }: { s: MaterialStatus; sm?: boolean }) {
  const m = SM[s] ?? SM.Pending
  return (
    <Badge
      size={sm ? 'sm' : 'default'}
      className="border-0"
      style={{ background: m.bg, color: m.c }}
    >
      <Dot color={m.dot} />
      {s}
    </Badge>
  )
}

export function EvBadge({ s }: { s: EventStatus }) {
  const m = eventStatusStyle(s)
  return (
    <Badge size="sm" className="gap-1.5 px-2.5 text-xs" style={{ background: m.bg, color: m.c }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.dot }} />
      {s}
    </Badge>
  )
}

export function GuestBadge({ s }: { s: GuestStatus }) {
  const m = GUEST_ST[s] ?? GUEST_ST.Registered
  return (
    <Badge className="border-0 font-semibold" style={{ background: m.bg, color: m.c }}>
      <Dot color={m.dot} />
      {s}
    </Badge>
  )
}
