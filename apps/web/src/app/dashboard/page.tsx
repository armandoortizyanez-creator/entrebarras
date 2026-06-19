import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-3)' }}>
          Bienvenido, {user?.email}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {KPI_PLACEHOLDERS.map((kpi) => (
          <div key={kpi.label} style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: 20,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              {kpi.label}
            </p>
            <p style={{ fontSize: 32, fontWeight: 700, color: kpi.accent ? 'var(--color-red)' : 'var(--color-text)', letterSpacing: '-0.02em' }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Empty state placeholder */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', padding: 48,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 32, marginBottom: 12 }}>🏋️</p>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
          Configura tu espacio
        </h3>
        <p style={{ fontSize: 14, color: 'var(--color-text-3)', maxWidth: 360, margin: '0 auto' }}>
          Empieza agregando tus primeros atletas y creando tus primeras rutinas.
        </p>
      </div>
    </div>
  )
}

const KPI_PLACEHOLDERS = [
  { label: 'Atletas activos', value: '0' },
  { label: 'Sesiones esta semana', value: '0' },
  { label: 'Cumplimiento', value: '—' },
  { label: 'En riesgo', value: '0', accent: true },
]
