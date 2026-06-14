import type { MaterialStatus, EventStatus, GuestStatus, Priority } from './mock-data'

export interface StatusStyle {
  bg: string
  c: string
  dot: string
}

/** Material 5-state lifecycle → monochrome purple ramp + navy. */
export const STS: MaterialStatus[] = ['Pending', 'In Progress', 'Needs Review', 'Done', 'Issue']

export const SM: Record<MaterialStatus, StatusStyle> = {
  Pending: { bg: '#F0EEF6', c: '#79708C', dot: '#D2C9E6' },
  'In Progress': { bg: '#EFE9FB', c: '#7C3AED', dot: '#A78BFA' },
  'Needs Review': { bg: '#F4E6FB', c: '#9D29C0', dot: '#C879EC' },
  Done: { bg: '#E9DCFA', c: '#6D28D9', dot: '#7C3AED' },
  Issue: { bg: '#EAE8F0', c: '#3A3550', dot: '#2B2A3F' },
}

/** Material priority dot colors. */
export const PC: Record<Priority, string> = {
  High: '#7C3AED',
  Medium: '#A78BFA',
  Low: '#C9C4D6',
}

export function eventStatusStyle(s: EventStatus): StatusStyle {
  if (s === 'Public') return { bg: 'var(--ad)', c: 'var(--ac)', dot: 'var(--ac)' }
  if (s === 'Archived') return { bg: '#EAE8F0', c: '#3A3550', dot: '#2B2A3F' }
  // Draft
  return { bg: '#EFEDF4', c: '#6B6478', dot: '#B6B0C8' }
}

export const GUEST_ST: Record<GuestStatus, StatusStyle> = {
  'Checked-in': { bg: 'var(--ad)', c: 'var(--ac)', dot: 'var(--ac)' },
  Registered: { bg: '#EFEDF4', c: '#6B6478', dot: '#B6B0C8' },
  Cancelled: { bg: '#EAE8F0', c: '#3A3550', dot: '#2B2A3F' },
}
