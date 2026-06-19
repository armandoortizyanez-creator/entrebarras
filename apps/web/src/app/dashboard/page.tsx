import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DashboardStats } from './DashboardStats'

export const metadata: Metadata = { title: 'Dashboard' }

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName = user?.user_metadata?.first_name ?? user?.email?.split('@')[0] ?? 'Coach'
  const greeting = getGreeting()
  const today = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1180 }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700,
          color: 'var(--color-text)',
          letterSpacing: '-0.03em',
          marginBottom: 4,
        }}>
          {greeting}, {firstName}
        </h1>
        <p style={{
          fontSize: 13.5,
          color: 'var(--color-text-3)',
          textTransform: 'capitalize',
        }}>
          {today}
        </p>
      </div>

      <DashboardStats />
    </div>
  )
}
