import type { CSSProperties } from 'react'
import { Ic } from './icon'

/**
 * Replacement for the prototype's <image-slot> web component: an on-brand
 * gradient placeholder with a "drop photo" affordance. Real uploads will swap
 * to <next/image> sourced from Rustfs presigned URLs (spec §7 / docs/04).
 */
export function GradientSlot({
  height = 168,
  gradient = 'linear-gradient(135deg,#7C3AED,#C026D3)',
  placeholder = 'Drop event photo',
  radius = 0,
  style,
}: {
  height?: number | string
  gradient?: string
  placeholder?: string
  radius?: number
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        width: '100%',
        height,
        background: gradient,
        borderRadius: radius,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        color: 'rgba(255,255,255,.85)',
        ...style,
      }}
    >
      <Ic n="report" sz={22} c="rgba(255,255,255,.6)" />
      <span style={{ fontSize: 11.5, fontWeight: 500 }}>{placeholder}</span>
    </div>
  )
}
