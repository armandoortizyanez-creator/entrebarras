import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DashboardStats } from './DashboardStats'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const firstName = user?.user_metadata?.first_name ?? user?.email?.split('@')[0] ?? 'Coach'

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: 24, fontWeight: 700, color: 'var(--color-text)',
          letterSpacing: '-0.02em', marginBottom: 4,
        }}>
          Hola, {firstName} 👋
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-3)' }}>
          {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <DashboardStats />
    </div>
  )
}
