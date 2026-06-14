'use client'

import { usePathname } from 'next/navigation'
import { Ic } from '@/components/ui/icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/toast'
import { signOut } from '@/lib/auth/session'
import { titleForPath } from './nav-config'

const NOTIFICATIONS = [
  { id: 1, text: 'Maya Rodriguez checked in to TechConf 2026', at: 'Just now' },
  { id: 2, text: 'Branding Kit v2 moved to Needs Review', at: '8m ago' },
  { id: 3, text: '5 event proposals awaiting your approval', at: '1h ago' },
]

export function Topbar({ onToggle }: { onToggle: () => void }) {
  const pathname = usePathname()
  const title = titleForPath(pathname)
  const { toast } = useToast()

  const handleSignOut = () => {
    signOut()
    window.location.assign('/')
  }

  return (
    <div className="tb">
      <button
        onClick={onToggle}
        aria-label="Toggle sidebar"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          color: 'var(--t2)',
          display: 'flex',
        }}
      >
        <Ic n="mnu" sz={19} />
      </button>

      <div style={{ flex: 1 }}>
        <div className="pgt">{title}</div>
      </div>

      <div style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: 9,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        >
          <Ic n="srch" sz={13} c="var(--t3)" />
        </div>
        <input className="si" placeholder="Search events, guests…" />
      </div>

      <button
        onClick={() => toast('Telegram ops channel connected')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 8,
          background: '#EFEDF4',
          border: '1px solid var(--bo)',
          fontSize: 11.5,
          color: 'var(--t2)',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ac)' }} />
        Telegram
      </button>

      {/* notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Notifications"
            style={{
              position: 'relative',
              cursor: 'pointer',
              display: 'flex',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            <Ic n="bel" sz={19} c="var(--t2)" />
            <div
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 7,
                height: 7,
                background: 'var(--ac)',
                borderRadius: '50%',
                border: '1.5px solid white',
              }}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[300px]">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {NOTIFICATIONS.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex-col items-start gap-0.5"
              onClick={() => toast('Opened notification')}
            >
              <span className="text-[12.5px] font-medium text-foreground">{n.text}</span>
              <span className="text-[11px] text-muted-foreground">{n.at}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => toast('All notifications marked read')}>
            <Ic n="chk" sz={14} c="var(--ac)" />
            Mark all as read
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* account */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="av" aria-label="Account menu" style={{ border: 'none' }}>
            AD
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>
            <div className="text-[13px] font-semibold text-foreground">Admin User</div>
            <div className="text-[11px] font-normal text-muted-foreground">admin@gatherly.co</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => toast('Profile coming soon')}>
            <Ic n="usr" sz={15} c="var(--t2)" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast('Settings coming soon')}>
            <Ic n="set" sz={15} c="var(--t2)" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <Ic n="logout" sz={15} c="#2B2A3F" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
