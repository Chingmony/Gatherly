import { team as mockTeam } from '@/lib/mock-data'
import type { TeamMember } from './types'

/** All org members (Handler Allocations view). */
export function listTeam(): TeamMember[] {
  return mockTeam
}
