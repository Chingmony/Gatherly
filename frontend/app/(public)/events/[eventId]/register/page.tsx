import { notFound } from 'next/navigation'
import { RegisterClient } from '@/components/public/register-client'
import { eventBySlugOrId, getRegistrationForm } from '@/lib/api'

export default async function RegisterPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const event = eventBySlugOrId(eventId)
  if (!event) notFound()

  return <RegisterClient event={event} fields={getRegistrationForm(eventId).schema} />
}
