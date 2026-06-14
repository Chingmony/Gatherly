export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* brand panel */}
      <div
        style={{
          flex: '1 1 0',
          background: 'linear-gradient(150deg,#7C3AED 0%,#6D28D9 45%,#2B2A3F 100%)',
          color: '#fff',
          padding: '48px 52px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
        className="auth-brand"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              background: 'rgba(255,255,255,.16)',
              border: '1px solid rgba(255,255,255,.25)',
              borderRadius: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            G
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em' }}>Gatherly</span>
        </div>

        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-.02em' }}>
            Events, orchestrated end to end.
          </div>
          <p
            style={{ fontSize: 14, color: 'rgba(255,255,255,.78)', marginTop: 16, lineHeight: 1.6 }}
          >
            Plan events, delegate to your team, track materials through five states, and check
            guests in with QR tickets — all in one operations console.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
            {[
              'Three-tier roles & per-event delegation',
              'Dynamic registration forms',
              'QR check-in with live attendance',
            ].map((t) => (
              <div
                key={t}
                style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width={12}
                    height={12}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)' }}>© 2026 Gatherly</div>
      </div>

      {/* form panel */}
      <div
        style={{
          flex: '1 1 0',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px',
        }}
      >
        {children}
      </div>
    </div>
  )
}
