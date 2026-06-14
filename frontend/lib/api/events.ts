import { events as mockEvents, featured as mockFeatured } from '@/lib/mock-data'
import {
  getEvent as lookupEvent,
  eventBySlugOrId as lookupBySlugOrId,
  eventAgenda,
} from '@/lib/event-data'
import type { EventRow, FeaturedEvent, AgendaItem } from './types'

/** All events (admin Event Monitoring + dashboard table). */
export function listEvents(): EventRow[] {
  return mockEvents
}

/** A single event by numeric id. */
export function getEvent(id: string): EventRow | undefined {
  return lookupEvent(id)
}

/** Resolve a public registration param that may be a slug or a numeric id. */
export function eventBySlugOrId(value: string): EventRow | undefined {
  return lookupBySlugOrId(value)
}

/** Featured photo-card events for the dashboard. */
export function listFeaturedEvents(): FeaturedEvent[] {
  return mockFeatured
}

/** Day-of agenda for an event (mock is shared across events for now). */
export function getAgenda(_eventId?: string): AgendaItem[] {
  return eventAgenda
}
