import { Kanban } from '@/components/kanban/kanban'
import { cardStyle } from '@/components/ui/primitives'
import { getEvent, materialsForEvent } from '@/lib/api'

export default async function MaterialsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const event = getEvent(eventId)!
  const evMats = materialsForEvent(event.name)

  return (
    <div style={{ ...cardStyle, padding: '18px 20px' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
        Material Board
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 16 }}>
        {evMats.length} item{evMats.length !== 1 ? 's' : ''} · click a status to update it
      </div>
      <Kanban initial={evMats} />
    </div>
  )
}
