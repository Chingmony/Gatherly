/**
 * lib/api — the single data-access seam for the UI (spec 05 §3).
 * Components and pages import from here only; swapping mock → real API happens
 * inside this folder (see client.ts).
 */
export * from './types'
export * from './client'
export * from './events'
export * from './materials'
export * from './guests'
export * from './organization'
export * from './team'
export * from './forms'
export * from './attendance'
export * as auth from './auth'
