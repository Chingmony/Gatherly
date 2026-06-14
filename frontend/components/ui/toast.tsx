'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Ic, type IconName } from '@/components/ui/icon'

type ToastTone = 'success' | 'info'
interface ToastItem {
  id: number
  message: string
  tone: ToastTone
  icon: IconName
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const toast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = ++seq.current
    setItems((prev) => [...prev, { id, message, tone, icon: tone === 'success' ? 'chk' : 'alrt' }])
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              minWidth: 240,
              maxWidth: 360,
              padding: '12px 16px',
              borderRadius: 12,
              background: 'var(--ca)',
              border: '1px solid var(--bo)',
              boxShadow: 'var(--sh2)',
              animation: 'slideIn .25s ease',
              pointerEvents: 'auto',
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: 'var(--ad)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Ic n={t.icon} sz={14} c="var(--ac)" />
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
