'use client'

import { useRef } from 'react'

export function OtpInput({
  value,
  onChange,
  length = 6,
}: {
  value: string
  onChange: (v: string) => void
  length?: number
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const setChar = (i: number, ch: string) => {
    const next = value.split('')
    next[i] = ch
    const joined = next.join('').slice(0, length)
    onChange(joined)
  }

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, '').slice(-1)
            setChar(i, ch)
            if (ch && i < length - 1) refs.current[i + 1]?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus()
          }}
          onPaste={(e) => {
            e.preventDefault()
            const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
            if (digits) {
              onChange(digits)
              refs.current[Math.min(digits.length, length - 1)]?.focus()
            }
          }}
          style={{
            width: '100%',
            aspectRatio: '1',
            maxWidth: 52,
            textAlign: 'center',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--t1)',
            border: `1px solid ${value[i] ? 'var(--ac)' : 'var(--bo)'}`,
            borderRadius: 12,
            background: value[i] ? 'var(--ad)' : 'var(--bg)',
            outline: 'none',
            fontFamily: 'ui-monospace,Menlo,monospace',
          }}
        />
      ))}
    </div>
  )
}
