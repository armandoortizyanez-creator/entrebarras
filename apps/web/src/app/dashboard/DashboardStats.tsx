'use client'

import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '@/lib/queries/dashboard'
import { getComplianceData } from '@/lib/queries/athletes'
import Link from 'next/link'
import { Users, CalendarDays, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react'

const KPI_ICONS = [Users, CalendarDays, TrendingUp, AlertTriangle]
const KPI_COLORS = [
  { icon: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  { icon: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  { icon: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  { icon: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
]

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
    { label: 'Atletas activos',       value: stats?.activeAthletes ?? 0,   href: '/dashboard/atletas',    suffix: '' },
    { label: 'Sesiones esta semana',   value: stats?.weekSessions ?? 0,     href: '/dashboard/calendario', suffix: '' },
    { label: 'Cumplimiento',           value: stats?.complianceRate ?? null, href: '/dashboard/reportes',   suffix: '%', nullText: '—' },
    { label: 'En riesgo de abandono',  value: stats?.atRisk ?? 0,           href: '/dashboard/reportes',   suffix: '', accent: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {kpis.map((kpi, i) => {
          const Icon = KPI_ICONS[i]
          const colors = KPI_COLORS[i]
          const displayValue = kpi.value === null
            ? (kpi.nullText ?? '—')
            : `${kpi.value}${kpi.suffix}`

          return (
            <Link key={kpi.label} href={kpi.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 22px',
                boxShadow: 'var(--shadow-card)',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s, transform 0.15s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow = 'var(--shadow-card-hover)'
                el.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow = 'var(--shadow-card)'
                el.style.transform = 'translateY(0)'
              }}
              >
                {/* Top accent line */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, ${colors.icon}40, ${colors.icon}15)`,
                  borderRadius: '14px 14px 0 0',
                }} />

                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <Icon size={16} color={colors.icon} strokeWidth={2} />
                </div>

                <p style={{
                  fontSize: 11, fontWeight: 600,
                  color: 'var(--color-text-3)',
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  marginBottom: 6,
                }}>
                  {kpi.label}
                </p>
                <p style={{
                  fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em',
                  color: kpi.accent && (kpi.value as number) > 0 ? 'var(--color-error)' : 'var(--color-text)',
                  lineHeight: 1,
                }}>
                  {displayValue}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Atletas en riesgo */}
      {atRiskAthletes && atRiskAthletes.length > 0 && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'var(--color-error-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={13} color="var(--color-error)" strokeWidth={2} />
              </div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                Atletas en riesgo de abandono
              </h2>
            </div>
            <Link
              href="/dashboard/reportes"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12.5, fontWeight: 500,
                color: 'var(--color-red)', textDecoration: 'none',
              }}
            >
              Ver todos <ArrowRight size={13} strokeWidth={2} />
            </Link>
          </div>
          <div>
            {atRiskAthletes.slice(0, 5).map((a, i) => (
              <Link
                key={a.athlete_id}
                href={`/dashboard/atletas/${a.athlete_id}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 22px',
                  borderBottom: i < Math.min(atRiskAthletes.length, 5) - 1 ? '1px solid var(--color-border)' : 'none',
                  textDecoration: 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667EEA22, #764BA222)',
                    border: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)',
                    flexShrink: 0,
                  }}>
                    {a.first_name?.[0]}{a.last_name?.[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--color-text)' }}>
                      {a.first_name} {a.last_name}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 1 }}>
                      {a.days_since_last_workout != null
                        ? `Sin entrenar hace ${a.days_since_last_workout} días`
                        : 'Sin entrenamientos registrados'}
                    </p>
                  </div>
                </div>
                <RiskBadge days={a.days_since_last_workout} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!atRiskAthletes || atRiskAthletes.length === 0) && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '56px 24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #F0F4FF, #E8F0FE)',
            border: '1px solid #BFDBFE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <TrendingUp size={24} color="#2563EB" strokeWidth={2} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
            Todo en orden
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-3)', maxWidth: 340, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Comienza agregando tus primeros atletas y asignando entrenamientos para ver métricas aquí.
          </p>
          <Link href="/dashboard/atletas" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--color-red)', color: '#fff',
            padding: '9px 22px', borderRadius: 'var(--radius-md)',
            fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
          }}>
            <Users size={14} strokeWidth={2} />
            Agregar atleta
          </Link>
        </div>
      )}
    </div>
  )
}

function RiskBadge({ days }: { days: number | null }) {
  if (days === null) return null
  const config = days >= 14
    ? { color: 'var(--color-error)', bg: 'var(--color-error-bg)', label: 'Alto riesgo' }
    : days >= 7
    ? { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', label: 'Riesgo medio' }
    : { color: 'var(--color-info)', bg: 'var(--color-info-bg)', label: 'Riesgo bajo' }

  return (
    <span style={{
      fontSize: 11.5, fontWeight: 600, color: config.color, background: config.bg,
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
      letterSpacing: '0.01em',
    }}>
      {config.label}
    </span>
  )
}

function StatsSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 22px', height: 108,
          animation: 'pulse-skeleton 1.6s ease-in-out infinite',
        }} />
      ))}
    </div>
  )
}
