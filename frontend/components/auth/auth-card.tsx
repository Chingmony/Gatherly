import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="w-full max-w-[400px] p-8">
      <div className="text-[22px] font-bold tracking-[-0.02em] text-foreground">{title}</div>
      <div className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{subtitle}</div>
      <div className="mt-6">{children}</div>
    </Card>
  )
}

export function AuthLabel({ children }: { children: ReactNode }) {
  return <Label className="mb-1.5 block">{children}</Label>
}

export function AuthButton({
  children,
  type = 'button',
  onClick,
  disabled,
}: {
  children: ReactNode
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <Button type={type} onClick={onClick} disabled={disabled} size="lg" className="w-full">
      {children}
    </Button>
  )
}
