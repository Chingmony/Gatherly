import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          height: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 24px',
          background: 'var(--ca)',
          borderBottom: '1px solid var(--bo)',
        }}
      >
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              background: 'var(--ac)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            G
          </div>
          <span
            style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.02em' }}
          >
            Gatherly
          </span>
        </Link>
        <div style={{ flex: 1 }} />
        <Button asChild variant="secondary" size="sm">
          <Link href="/login">Staff sign in</Link>
        </Button>
      </header>
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 16px 56px',
        }}
      >
        {children}
      </main>
      <footer
        style={{
          padding: '20px 16px',
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--t3)',
        }}
      >
        Powered by Gatherly · events@gatherly.co
      </footer>
    </div>
  )
}
