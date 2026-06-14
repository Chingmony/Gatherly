import { CardHead, Pill } from '@/components/ui/primitives'

const REG = [
  { m: 'Jan', reg: 220, chk: 150 },
  { m: 'Feb', reg: 280, chk: 190 },
  { m: 'Mar', reg: 360, chk: 250 },
  { m: 'Apr', reg: 300, chk: 210 },
  { m: 'May', reg: 440, chk: 320 },
  { m: 'Jun', reg: 500, chk: 380 },
  { m: 'Jul', reg: 560, chk: 430 },
  { m: 'Aug', reg: 480, chk: 360 },
]
const AXMAX = 600
const AXTICKS = [0, 150, 300, 450, 600]
const PLOT = 176

export function BarChart() {
  const peakReg = Math.max(...REG.map((d) => d.reg))
  const totalReg = REG.reduce((s, d) => s + d.reg, 0)
  return (
    <div>
      <CardHead title="Guest Registrations" right={<Pill>Last 8 months</Pill>} />
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          marginTop: -8,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.02em' }}>
          {totalReg.toLocaleString()}
        </div>
        <div style={{ display: 'flex', gap: 14, marginLeft: 'auto' }}>
          {[
            { c: '#E6E1F3', l: 'Registered' },
            { c: 'var(--ac)', l: 'Checked-in' },
          ].map((x) => (
            <span
              key={x.l}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11.5,
                color: 'var(--t2)',
                fontWeight: 500,
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: 3, background: x.c }} />
              {x.l}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: PLOT,
          }}
        >
          {[...AXTICKS].reverse().map((t) => (
            <span key={t} style={{ fontSize: 10, color: 'var(--t3)', lineHeight: 1 }}>
              {t}
            </span>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ position: 'relative', height: PLOT }}>
            {AXTICKS.map((t) => (
              <div
                key={t}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: (1 - t / AXMAX) * PLOT,
                  height: 1,
                  background: 'var(--bo)',
                }}
              />
            ))}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: 6,
              }}
            >
              {REG.map((d) => {
                const peak = d.reg === peakReg
                return (
                  <div
                    key={d.m}
                    style={{
                      flex: 1,
                      position: 'relative',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                    }}
                  >
                    {peak && (
                      <div
                        style={{
                          position: 'absolute',
                          top: (1 - d.chk / AXMAX) * PLOT - 36,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#1C1633',
                          color: '#fff',
                          fontSize: 10.5,
                          fontWeight: 600,
                          padding: '4px 8px',
                          borderRadius: 7,
                          whiteSpace: 'nowrap',
                          zIndex: 3,
                        }}
                      >
                        {d.chk} in
                        <span
                          style={{
                            position: 'absolute',
                            bottom: -4,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop: '4px solid #1C1633',
                          }}
                        />
                      </div>
                    )}
                    <div
                      style={{
                        position: 'relative',
                        width: 22,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'flex-end',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          width: '100%',
                          height: (d.reg / AXMAX) * 100 + '%',
                          background: '#E6E1F3',
                          borderRadius: 99,
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: '20%',
                          width: '60%',
                          height: (d.chk / AXMAX) * 100 + '%',
                          background: 'var(--ac)',
                          borderRadius: 99,
                          boxShadow: peak ? '0 4px 10px var(--al)' : 'none',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {REG.map((d) => (
              <span
                key={d.m}
                style={{ flex: 1, textAlign: 'center', fontSize: 10.5, color: 'var(--t3)' }}
              >
                {d.m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
