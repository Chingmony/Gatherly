import { guests as mockGuests } from '@/lib/mock-data'
import { guestsForEvent as lookupGuestsForEvent, getTicket as lookupTicket } from '@/lib/event-data'
import type { Guest } from './types'

/** All registered guests (across events). */
export function listGuests(): Guest[] {
  return mockGuests
}

/** Guests registered for a single event (by event name). */
export function guestsForEvent(eventName: string): Guest[] {
  return lookupGuestsForEvent(eventName)
}

/** Resolve a guest ticket by its checkin token. */
export function getTicket(token: string): Guest | undefined {
  return lookupTicket(token)
}
