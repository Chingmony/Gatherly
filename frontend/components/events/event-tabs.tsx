'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { seg: 'overview', label: 'Overview' },
  { seg: 'members', label: 'Members' },
  { seg: 'materials', label: 'Materials' },
  { seg: 'agenda', label: 'Agenda' },
  { seg: 'form-builder', label: 'Form Builder' },
  { seg: 'guests', label: 'Guests' },
  { seg: 'scan', label: 'Scan' },
]

export function EventTabs({ eventId }: { eventId: string }) {
  const pathname = usePathname()
  return (
    <div className="ev-tabs">
      {TABS.map((t) => {
        const href = `/events/${eventId}/${t.seg}`
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link key={t.seg} href={href} className={`ev-tab${active ? 'act' : ''}`}>
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
