import { team as mockTeam } from '@/lib/mock-data'
import { eventMembers as mockEventMembers } from '@/lib/event-data'
import type { TeamMember, EventMember } from './types'

/** All org members (Handler Allocations view). */
export function listTeam(): TeamMember[] {
  return mockTeam
}

/** Members assigned to a single event (managers + handlers). */
export function listEventMembers(_eventId?: string): EventMember[] {
  return mockEventMembers
}
