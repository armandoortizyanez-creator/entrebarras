import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CalendarioView } from './CalendarioView'
export const metadata: Metadata = { title: 'Calendario' }
export default async function CalendarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = (user?.app_metadata?.role ?? 'athlete') as string
  return <CalendarioView userRole={role} />
}
