'use client'

import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '@/lib/queries/dashboard'
import { getComplianceData } from '@/lib/queries/athletes'
import Link from 'next/link'

export function DashboardStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  })

  const { data: atRiskAthletes } = useQuery({
    queryKey: ['compliance'],
    queryFn: getComplianceData,
  })

  if (isLoading) return <StatsSkeleton />

  const kpis = [
    { label: 'Atletas activos', value: stats?.activeAthletes ?? 0, href: '/dashboard/atletas' },
    { label: 'Sesiones esta semana', value: stats?.weekSessions ?? 0, href: '/dashboard/calendario' },
    {
      label: 'Cumplimiento',
      value: stats?.complianceRate != null ? `${stats.complianceRate}%` : 'Sin datos',
      href: '/dashboard/reportes',
    },
    {
      label: 'En riesgo de abandono',
      value: stats?.atRisk ?? 0,
      href: '/dashboard/reportes',
      accent: (stats?.atRisk ?? 0) > 0,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: '20px 24px',
              boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
              transition: 'box-shadow 0.15s, border-color 0.15s',
            }}>
              <p style={{
                fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
              }}>
                {kpi.label}
              </p>
              <p style={{
                fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em',
                color: kpi.accent ? 'var(--color-red)' : 'var(--color-text)',
              }}>
                {kpi.value}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Atletas en riesgo */}
      {atRiskAthletes && atRiskAthletes.length > 0 && (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 24px', borderBottom: '1px solid var(--color-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>
              Atletas en riesgo de abandono
            </h2>
            <Link href="/dashboard/reportes" style={{ fontSize: 13, color: 'var(--color-red)', textDecoration: 'none' }}>
              Ver todos
            </Link>
          </div>
          <div>
            {atRiskAthletes.slice(0, 5).map((a, i) => (
              <div key={a.athlete_id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 24px',
                borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--color-surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 600, color: 'var(--color-text-2)',
                  }}>
                    {a.first_name?.[0]}{a.last_name?.[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                      {a.first_name} {a.last_name}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                      {a.days_since_last_workout != null
                        ? `Sin entrenar hace ${a.days_since_last_workout} días`
                        : 'Sin entrenamientos registrados'}
                    </p>
                  </div>
                </div>
                <RiskBadge days={a.days_since_last_workout} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!atRiskAthletes || atRiskAthletes.length === 0) && (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 28, marginBottom: 12 }}>🏋️</p>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
            Todo en orden
          </h3>
          <p style={{ fontSize: 14, color: 'var(--color-text-3)', maxWidth: 360, margin: '0 auto 20px' }}>
            Comienza agregando tus primeros atletas y asignando entrenamientos.
          </p>
          <Link href="/dashboard/atletas" style={{
            display: 'inline-block',
            background: 'var(--color-red)', color: '#fff',
            padding: '8px 20px', borderRadius: 'var(--radius-md)',
            fontSize: 14, fontWeight: 500, textDecoration: 'none',
          }}>
            Agregar atleta
          </Link>
        </div>
      )}
    </div>
  )
}

function RiskBadge({ days }: { days: number | null }) {
  if (days === null) return null
  const color = days >= 14 ? 'var(--color-error)' : days >= 7 ? 'var(--color-warning)' : 'var(--color-info)'
  const bg = days >= 14 ? 'var(--color-error-bg)' : days >= 7 ? 'var(--color-warning-bg)' : 'var(--color-info-bg)'
  const label = days >= 14 ? 'Alto' : days >= 7 ? 'Medio' : 'Bajo'

  return (
    <span style={{
      fontSize: 12, fontWeight: 500, color, background: bg,
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
    }}>
      {label}
    </span>
  )
}

function StatsSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: '20px 24px', height: 88,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  )
}
