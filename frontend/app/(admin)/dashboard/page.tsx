import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/dashboard/stat-card'
import { DonutCard } from '@/components/dashboard/donut'
import { BarChart } from '@/components/dashboard/bar-chart'
import { CategoryBars } from '@/components/dashboard/category-bars'
import { EvTable } from '@/components/dashboard/ev-table'
import { Ticker } from '@/components/dashboard/ticker'
import { ImgEventCard, UpcomingHero } from '@/components/dashboard/photo-cards'
import { cardStyle } from '@/components/ui/primitives'
import { STS, SM } from '@/lib/status'
import { listEvents, listMaterials, listRecentCheckIns, listFeaturedEvents } from '@/lib/api'

export default function DashboardPage() {
  const events = listEvents()
  const materials = listMaterials()
  const checkIns = listRecentCheckIns()
  const featured = listFeaturedEvents()
  const donut = STS.map((s) => ({
    label: s,
    value: materials.filter((m) => m.s === s).length,
    color: SM[s].dot,
  }))

  return (
    <div className="dgrid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <div className="dstats">
          <StatCard
            ic="zap"
            icC="#7C3AED"
            value={8}
            label="Total Active Events"
            badge="+12%"
            badgeType="up"
            sub="vs. last month"
          />
          <StatCard
            ic="pkg"
            icC="#C026D3"
            value="32 / 48"
            label="Materials Allocated"
            badge="In transit"
            badgeType="info"
            sub="16 awaiting handler"
          />
          <StatCard
            ic="alrt"
            icC="#7C3AED"
            value={5}
            label="Pending Event Proposals"
            badge="Review"
            badgeType="warn"
            sub="awaiting admin approval"
          />
          <StatCard
            ic="qr"
            icC="#C026D3"
            value="1,284"
            label="Checked-In Guests"
            badge="+127"
            badgeType="up"
            sub="via QR scan today"
          />
        </div>
        <div className="dcharts">
          <DonutCard data={donut} total={materials.length} />
          <div style={cardStyle}>
            <BarChart />
          </div>
        </div>
        <CategoryBars />
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div
              style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.01em' }}
            >
              All Events
            </div>
            <Button asChild variant="soft" size="sm">
              <Link href="/events">View all events</Link>
            </Button>
          </div>
          <div className="dcards">
            {featured.map((ev) => (
              <ImgEventCard key={ev.id} ev={ev} />
            ))}
          </div>
        </div>
        <EvTable events={events} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.01em' }}>
          Upcoming Event
        </div>
        <UpcomingHero />
        <Ticker init={checkIns} />
      </div>
    </div>
  )
}
