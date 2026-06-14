import type { IconName } from '@/components/ui/icon'

export interface NavItem {
  href: string
  label: string
  icon: IconName
  /** Topbar page title for this route. */
  title: string
}

export interface NavGroup {
  group: string
  items: NavItem[]
}

/**
 * Sidebar nav. Routes follow the spec route tree (01-architecture-layout §3):
 * (admin) console — events, supply-list, users, organization — plus the
 * event-scoped guests/scan surfaces hoisted to the console for the prototype.
 */
export const NAV: NavGroup[] = [
  {
    group: 'Operations',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'dash', title: 'Dashboard' },
      { href: '/events', label: 'Event Monitoring', icon: 'monitor', title: 'Event Monitoring' },
      { href: '/supply-list', label: 'Material Catalog', icon: 'pkg', title: 'Material Catalog' },
      { href: '/users', label: 'Handler Allocations', icon: 'usr', title: 'Handler Allocations' },
      { href: '/guests', label: 'Guest Lists', icon: 'ticket', title: 'Guest Lists' },
    ],
  },
  {
    group: 'Insights',
    items: [
      { href: '/scan', label: 'QR Scanner', icon: 'qr', title: 'QR Scanner' },
      { href: '/organization', label: 'Org Profile', icon: 'bld', title: 'Org Profile' },
    ],
  },
]

export const ALL_NAV: NavItem[] = NAV.flatMap((g) => g.items)

export function titleForPath(pathname: string): string {
  const match = ALL_NAV.find((i) => pathname.startsWith(i.href))
  return match?.title ?? 'Dashboard'
}
