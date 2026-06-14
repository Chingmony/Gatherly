/**
 * On-screen QR fallback (spec §5.2 / §6). The real QR PNG is generated
 * server-side from the CSPRNG checkin_token and emailed; this is the
 * deterministic on-screen fallback. Rendered as an SVG module matrix seeded
 * from the token so it is stable per ticket (visual stand-in, not a scannable
 * code — swap for a real encoder when the backend issues the PNG).
 */
const N = 25 // modules per side

function seeded(token: string): boolean[] {
  // Simple deterministic hash → boolean grid with quiet finder corners.
  let h = 2166136261
  const cells: boolean[] = []
  for (let i = 0; i < N * N; i++) {
    h ^= token.charCodeAt(i % token.length) + i * 31
    h = Math.imul(h, 16777619)
    cells.push(((h >>> 7) & 1) === 1)
  }
  return cells
}

function isFinder(r: number, c: number): boolean {
  const inBox = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7
  return inBox(0, 0) || inBox(0, N - 7) || inBox(N - 7, 0)
}

function finderModule(r: number, c: number): boolean {
  // Render the 7x7 finder pattern (border ring + 3x3 center).
  const local = (br: number, bc: number) => {
    const lr = r - br
    const lc = c - bc
    const ring = lr === 0 || lr === 6 || lc === 0 || lc === 6
    const center = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4
    return ring || center
  }
  if (r < 7 && c < 7) return local(0, 0)
  if (r < 7 && c >= N - 7) return local(0, N - 7)
  if (r >= N - 7 && c < 7) return local(N - 7, 0)
  return false
}

export function QrTicket({ token, size = 196 }: { token: string; size?: number }) {
  const cells = seeded(token)
  const m = size / N
  const rects: React.ReactNode[] = []
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const on = isFinder(r, c) ? finderModule(r, c) : cells[r * N + c]
      if (!on) continue
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={c * m}
          y={r * m}
          width={m + 0.4}
          height={m + 0.4}
          rx={m * 0.18}
          fill="#1C1633"
        />
      )
    }
  }
  return (
    <div
      style={{
        width: size + 24,
        height: size + 24,
        padding: 12,
        background: '#fff',
        borderRadius: 18,
        boxShadow: 'var(--sh)',
        border: '1px solid var(--bo)',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`QR ticket ${token}`}
      >
        {rects}
      </svg>
    </div>
  )
}
