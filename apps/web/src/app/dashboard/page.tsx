import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DashboardStats } from './DashboardStats'
import { AthleteHomeDashboard } from './AthleteHomeDashboard'

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

  const role = user?.app_metadata?.role as string | undefined
  const isAthlete = role === 'athlete'
  const firstName = user?.user_metadata?.first_name ?? user?.email?.split('@')[0] ?? (isAthlete ? 'Atleta' : 'Coach')
  const greeting = getGreeting()
  const today = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1180 }}>
      {/* Page header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-3)', marginBottom: 6 }}>
            {today.charAt(0).toUpperCase() + today.slice(1)}
          </p>
          <h1 style={{
            fontSize: 26, fontWeight: 800,
            color: 'var(--color-text)',
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
          }}>
            {greeting},{' '}
            <span style={{ color: 'var(--color-red)' }}>{firstName}</span>
          </h1>
        </div>
      </div>

      {isAthlete ? <AthleteHomeDashboard /> : <DashboardStats />}
    </div>
  )
}
