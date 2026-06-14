'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Ic } from '@/components/ui/icon'
import { signOut } from '@/lib/auth/session'
import { NAV } from './nav-config'

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()

  const handleSignOut = () => {
    signOut()
    window.location.assign('/')
  }

  return (
    <nav className={`sb${collapsed ? 'col' : ''}`}>
      <div className="sb-logo">
        <div className="lm">G</div>
        <span className="lt">Gatherly</span>
      </div>

      <div className="sb-nav">
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="ng">{g.group}</div>
            {g.items.map((it) => {
              const active = pathname.startsWith(it.href)
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`ni${active ? 'act' : ''}`}
                  title={collapsed ? it.label : ''}
                >
                  <div className="nico">
                    <Ic n={it.icon} sz={17} c={active ? 'var(--ac)' : 'var(--t2)'} />
                  </div>
                  <span className="nl">{it.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      <div className="sb-foot">
        <div className="ni" style={{ cursor: 'default' }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'var(--ac)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            AD
          </div>
          <div className="nl" style={{ opacity: collapsed ? 0 : 1, transition: 'opacity .2s' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.3 }}>
              Admin User
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 1 }}>
              admin@gatherly.co
            </div>
          </div>
        </div>
        <div
          className="so"
          title={collapsed ? 'Sign Out' : ''}
          onClick={handleSignOut}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSignOut()}
        >
          <div className="nico">
            <Ic n="logout" sz={17} c="currentColor" />
          </div>
          <span className="nl">Sign Out</span>
        </div>
      </div>
    </nav>
  )
}
