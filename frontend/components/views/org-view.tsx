'use client'

import { Ic, type IconName } from '@/components/ui/icon'
import { CardHead, cardStyle } from '@/components/ui/primitives'
import { GradientSlot } from '@/components/ui/gradient-slot'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { getOrganization } from '@/lib/api'

function OrgField({
  label,
  value,
  ph,
  icon,
  area,
  mono,
}: {
  label: string
  value: string
  ph?: string
  icon?: IconName
  area?: boolean
  mono?: boolean
}) {
  return (
    <label className="block">
      <Label className="mb-1.5 block">{label}</Label>
      <div className="relative">
        {icon && (
          <div
            className="pointer-events-none absolute left-3"
            style={{ top: area ? 13 : '50%', transform: area ? 'none' : 'translateY(-50%)' }}
          >
            <Ic n={icon} sz={15} c="var(--t3)" />
          </div>
        )}
        {area ? (
          <Textarea
            defaultValue={value}
            placeholder={ph}
            rows={3}
            className={icon ? 'pl-9' : undefined}
          />
        ) : (
          <Input
            defaultValue={value}
            placeholder={ph}
            className={`${icon ? 'pl-9' : ''}${mono ? 'font-mono' : ''}`.trim() || undefined}
          />
        )}
      </div>
    </label>
  )
}

export function OrgView() {
  const o = getOrganization()
  const { toast } = useToast()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* banner hero */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ position: 'relative' }}>
          <GradientSlot
            height={170}
            gradient="linear-gradient(120deg,#7C3AED,#C026D3)"
            placeholder="Drop organization banner"
          />
          <button
            onClick={() => toast('Banner upload opens here (Rustfs presigned URL)')}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'rgba(255,255,255,.92)',
              backdropFilter: 'blur(6px)',
              border: 'none',
              color: 'var(--t1)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              zIndex: 2,
            }}
          >
            <Ic n="edit" sz={14} c="var(--ac)" />
            Edit banner
          </button>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 18,
            padding: '0 24px 20px',
            marginTop: -42,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 20,
              background: 'var(--ac)',
              border: '4px solid var(--ca)',
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 30,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            G
          </div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--t1)',
                  letterSpacing: '-.02em',
                }}
              >
                {o.name}
              </span>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 99,
                  background: 'var(--ad)',
                  color: 'var(--ac)',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                Organization
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 3 }}>{o.tagline}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 4 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 13px',
                borderRadius: 9,
                background: 'var(--bg)',
                fontSize: 12,
                color: 'var(--t2)',
                fontWeight: 600,
              }}
            >
              <Ic n="usr" sz={14} c="var(--ac)" />
              {o.members} members
            </div>
          </div>
        </div>
      </div>

      {/* two column */}
      <div className="dcharts">
        <div style={cardStyle}>
          <CardHead
            title="Organization Details"
            sub="Admin only · branding is applied across the platform"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <OrgField label="Company name" value={o.name} icon="bld" />
            <OrgField label="Tagline" value={o.tagline} area />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <OrgField label="Website" value={o.website} icon="glob" />
              <OrgField label="Support email" value={o.email} icon="mail" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
              <Button onClick={() => toast('Organization profile saved')}>Save changes</Button>
              <Button variant="secondary" onClick={() => toast('Changes discarded')}>
                Cancel
              </Button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
              Branding
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 14 }}>
              Logo &amp; banner stored on Rustfs
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <GradientSlot height={92} radius={14} gradient="var(--ad)" placeholder="Logo" />
                <div
                  style={{ fontSize: 11, color: 'var(--t3)', marginTop: 7, textAlign: 'center' }}
                >
                  Logo · square
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <GradientSlot
                  height={92}
                  radius={14}
                  gradient="linear-gradient(120deg,#7C3AED,#C026D3)"
                  placeholder="Banner"
                />
                <div
                  style={{ fontSize: 11, color: 'var(--t3)', marginTop: 7, textAlign: 'center' }}
                >
                  Banner · wide
                </div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 14 }}>
              Operations
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <OrgField label="Telegram ops channel" value={o.telegram} icon="send" mono />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 8,
                    fontSize: 11.5,
                    color: 'var(--ac)',
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ac)' }}
                  />
                  Connected · forwarding live
                </div>
              </div>
              <OrgField label="QR ticket sender (SMTP)" value={o.email} icon="mail" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
