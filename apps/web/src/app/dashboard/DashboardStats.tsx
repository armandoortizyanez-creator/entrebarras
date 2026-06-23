'use client'

import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '@/lib/queries/dashboard'
import { getComplianceData } from '@/lib/queries/athletes'
import { getBoxScheduleRange } from '@/lib/queries/box-schedule'
import Link from 'next/link'
import { ArrowRight, Zap, Dumbbell, Users } from 'lucide-react'

const WOD_TYPE_COLORS: Record<string, string> = {
  amrap: '#818CF8', emom: '#A78BFA', for_time: '#C6FF00',
  tabata: '#F472B6', chipper: '#34D399', intervals: '#FBBF24', custom: '#8A93A8',
}
const WOD_TYPE_BG: Record<string, string> = {
  amrap: 'rgba(129,140,248,0.12)', emom: 'rgba(167,139,250,0.12)', for_time: 'rgba(198,255,0,0.10)',
  tabata: 'rgba(244,114,182,0.10)', chipper: 'rgba(52,211,153,0.10)', intervals: 'rgba(251,191,36,0.10)', custom: 'rgba(138,147,168,0.10)',
}

export function DashboardStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  })

  const { data: atRiskAthletes } = useQuery({
    queryKey: ['compliance'],
    queryFn: getComplianceData,
  })

  const todayStr = new Date().toISOString().split('T')[0]
  const { data: todaySchedule = [] } = useQuery({
    queryKey: ['box-schedule-today', todayStr],
    queryFn: () => getBoxScheduleRange(todayStr, todayStr),
  })

  if (isLoading) return <StatsSkeleton />

  const compliance = stats?.complianceRate ?? null
  const atRisk = stats?.atRisk ?? 0

  const kpis = [
    {
      period: 'TOTAL',
      value: stats?.activeAthletes ?? 0,
      suffix: '',
      status: 'Atletas activos',
      statusColor: '#16A34A',
      href: '/dashboard/atletas',
    },
    {
      period: 'ESTA SEMANA',
      value: stats?.weekSessions ?? 0,
      suffix: '',
      status: 'Sesiones completadas',
      statusColor: '#818CF8',
      href: '/dashboard/calendario',
    },
    {
      period: 'ÚLTIMO MES',
      value: compliance !== null ? compliance : null,
      suffix: '%',
      status: compliance !== null
        ? compliance >= 75 ? 'Muy bien' : compliance >= 50 ? 'Regular' : 'Bajo'
        : 'Sin datos',
      statusColor: compliance !== null
        ? compliance >= 75 ? '#16A34A' : compliance >= 50 ? '#D97706' : '#DC2626'
        : '#9CA3AF',
      href: '/dashboard/reportes',
    },
    {
      period: 'AHORA',
      value: atRisk,
      suffix: '',
      status: atRisk === 0 ? 'Todo en orden' : 'Requieren atención',
      statusColor: atRisk === 0 ? '#16A34A' : '#DC2626',
      href: '/dashboard/reportes',
    },
  ]

  const weekday = new Date().toLocaleDateString('es-CL', { weekday: 'long' })
  const dateLabel = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* WOD del día */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
            Hoy — <span style={{ color: 'var(--color-text-2)', textTransform: 'capitalize' }}>{weekday} {dateLabel}</span>
          </p>
          <Link href="/dashboard/programacion" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 500, color: 'var(--color-red)', textDecoration: 'none' }}>
            Programar <ArrowRight size={12} strokeWidth={2.5} />
          </Link>
        </div>
        {todaySchedule.length === 0 ? (
          <Link href="/dashboard/programacion" style={{
            display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
            background: 'var(--color-surface)', border: '1.5px dashed var(--color-border)',
            borderRadius: 14, padding: '20px 24px',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={18} color="#6366F1" />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-2)' }}>Sin WOD programado</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2 }}>Haz click para programar el entrenamiento de hoy.</p>
            </div>
          </Link>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todaySchedule.map(entry => {
              const isWod = !!entry.wod
              const name = entry.wod?.name ?? entry.routine?.name ?? 'Sin nombre'
              const type = entry.wod?.type
              const accent = type ? (WOD_TYPE_COLORS[type] ?? '#475569') : '#6366F1'
              const bg = type ? (WOD_TYPE_BG[type] ?? 'var(--color-bg)') : '#EEF2FF'
              const href = isWod && entry.wod_id ? `/dashboard/wods/${entry.wod_id}` : '/dashboard/programacion'

              return (
                <Link key={entry.id} href={href} style={{
                  display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none',
                  background: 'var(--color-surface)', border: `1px solid ${accent}33`,
                  borderLeft: `4px solid ${accent}`, borderRadius: 14, padding: '18px 24px',
                  transition: 'box-shadow 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isWod ? <Zap size={20} color={accent} /> : <Dumbbell size={20} color={accent} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>{name}</p>
                      {type && (
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 20, background: bg, color: accent, border: `1px solid ${accent}33` }}>
                          {type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    {entry.group && (
                      <p style={{ fontSize: 12, color: 'var(--color-text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Users size={11} />
                        {entry.group.name}
                      </p>
                    )}
                    {entry.notes && <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2 }}>{entry.notes}</p>}
                  </div>
                  <ArrowRight size={16} color="var(--color-text-3)" />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* KPIs estilo Everfit */}
      <div>
        <p style={{
          fontSize: 15, fontWeight: 600, color: 'var(--color-text)',
          marginBottom: 14, letterSpacing: '-0.01em',
        }}>
          Resumen
        </p>
        <div
          className="eb-kpi-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          {kpis.map((kpi) => (
            <Link
              key={kpi.period}
              href={kpi.href}
              style={{
                textDecoration: 'none',
                display: 'block',
                padding: '28px 28px 24px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 14,
                boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                transition: 'box-shadow 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.40)'
                el.style.transform = 'translateY(-2px)'
                el.style.borderColor = 'var(--color-border-2)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.25)'
                el.style.transform = 'translateY(0)'
                el.style.borderColor = 'var(--color-border)'
              }}
            >
              <p style={{
                fontSize: 10.5, fontWeight: 700,
                color: 'var(--color-text-3)',
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}>
                {kpi.period}
              </p>
              <p style={{
                fontSize: 48, fontWeight: 700,
                color: 'var(--color-text)',
                letterSpacing: '-0.05em',
                lineHeight: 1,
                marginBottom: 14,
              }}>
                {kpi.value !== null ? `${kpi.value}${kpi.suffix}` : '—'}
              </p>
              <p style={{
                fontSize: 13.5, fontWeight: 600,
                color: kpi.statusColor,
              }}>
                {kpi.status}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Atletas en riesgo */}
      {atRiskAthletes && atRiskAthletes.length > 0 && (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
              En riesgo de abandono
            </p>
            <Link
              href="/dashboard/reportes"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12.5, fontWeight: 500,
                color: 'var(--color-red)', textDecoration: 'none',
              }}
            >
              Ver todos <ArrowRight size={12} strokeWidth={2.5} />
            </Link>
          </div>
          <div>
            {atRiskAthletes.slice(0, 5).map((a, i) => (
              <Link
                key={a.athlete_id}
                href={`/dashboard/atletas/${a.athlete_id}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 24px',
                  borderBottom: i < Math.min(atRiskAthletes.length, 5) - 1
                    ? '1px solid var(--color-border)' : 'none',
                  textDecoration: 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#818CF8',
                    flexShrink: 0, letterSpacing: '-0.01em',
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
          borderRadius: 14,
          padding: '52px 24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-card)',
        }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
            Todo en orden
          </p>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-3)', maxWidth: 320, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Comienza agregando atletas y asignando entrenamientos para ver métricas aquí.
          </p>
          <Link href="/dashboard/atletas" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#C6FF00', color: '#0D1117',
            padding: '9px 22px', borderRadius: 8,
            fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
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
  const config = days >= 14
    ? { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', label: 'Alto riesgo' }
    : days >= 7
    ? { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Riesgo medio' }
    : { color: '#818CF8', bg: 'rgba(99,102,241,0.12)', label: 'Riesgo bajo' }

  return (
    <span style={{
      fontSize: 11.5, fontWeight: 600,
      color: config.color, background: config.bg,
      padding: '3px 10px', borderRadius: 999,
    }}>
      {config.label}
    </span>
  )
}

function StatsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} style={{
            padding: '24px 28px',
            borderRight: idx < 3 ? '1px solid var(--color-border)' : 'none',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div className="skeleton" style={{ height: 11, width: 56 }} />
            <div className="skeleton" style={{ height: 40, width: 72 }} />
            <div className="skeleton" style={{ height: 13, width: 96 }} />
          </div>
        ))}
      </div>
      {/* Two-column section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[0, 1].map((i) => (
          <div key={i} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 20 }}>
            <div className="skeleton" style={{ height: 14, width: 80, marginBottom: 16 }} />
            {[0, 1, 2].map((j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 12, width: '70%', marginBottom: 6 }} />
                  <div className="skeleton" style={{ height: 10, width: '45%' }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
