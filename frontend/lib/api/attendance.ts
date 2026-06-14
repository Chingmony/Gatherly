import { checkIns as mockCheckIns } from '@/lib/mock-data'
import type { CheckIn } from './types'

/** Recent live check-ins for the dashboard ticker. */
export function listRecentCheckIns(): CheckIn[] {
  return mockCheckIns
}

export type ScanOutcome = 'CHECKED_IN' | 'ALREADY_CHECKED_IN' | 'TICKET_INVALID' | 'NOT_ASSIGNED'

export interface ScanResult {
  outcome: ScanOutcome
  guestName?: string
  at?: string
}

/**
 * Organizer QR scan → confirm attendance.
 * Stub: the scanner view simulates results client-side for the prototype. Wire
 * this to `POST /events/{eventId}/attendance/scan` (idempotent; 201 / 409 /
 * 404 / 403 per spec §6) when the backend is available.
 */
export async function scan(_eventId: string, _checkinToken: string): Promise<ScanResult> {
  throw new Error('attendance.scan is not wired yet — scanner simulates results client-side.')
}
