'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDashboardStats } from '@/lib/queries/dashboard'
import { getComplianceData } from '@/lib/queries/athletes'
import { getBoxScheduleRange } from '@/lib/queries/box-schedule'
import Link from 'next/link'
import {
  ArrowRight, Zap, Dumbbell, Users, TrendingUp, Activity,
  AlertTriangle, CalendarDays, ChevronUp, ChevronDown,
  Clock, RotateCcw, Plus,
} from 'lucide-react'

const ACCENT  = '#6366F1'
const VIOLET  = '#7C3AED'
const LIME    = '#C6FF00'
const DARK_BG = '#0D1117'
const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const WOD_TYPE_COLORS: Record<string, string> = {
  amrap: '#818CF8', emom: '#A78BFA', for_time: '#C6FF00',
  tabata: '#F472B6', chipper: '#34D399', intervals: '#FBBF24', custom: '#8A93A8',
}
const WOD_TYPE_BG: Record<string, string> = {
  amrap: 'rgba(129,140,248,0.12)', emom: 'rgba(167,139,250,0.12)', for_time: 'rgba(198,255,0,0.10)',
  tabata: 'rgba(244,114,182,0.10)', chipper: 'rgba(52,211,153,0.10)', intervals: 'rgba(251,191,36,0.10)', custom: 'rgba(138,147,168,0.10)',
}

function useIsMobile() {
  const [v, setV] = useState(false)
  useEffect(() => {
    const fn = () => setV(window.innerWidth < 900)
    fn(); window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return v
}

export function DashboardStats() {
  const isMobile = useIsMobile()

  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: getDashboardStats })
  const { data: atRiskAthletes = [] } = useQuery({ queryKey: ['compliance'], queryFn: getComplianceData })
  const todayStr = new Date().toISOString().split('T')[0]
  const { data: todaySchedule = [] } = useQuery({
    queryKey: ['box-schedule-today', todayStr],
    queryFn: () => getBoxScheduleRange(todayStr, todayStr),
  })

  if (isLoading) return <StatsSkeleton isMobile={isMobile} />

  const compliance = stats?.complianceRate ?? null
  const atRisk = stats?.atRisk ?? 0

  const complianceColor = compliance === null ? '#8A93A8'
    : compliance >= 75 ? '#10B981' : compliance >= 50 ? '#F59E0B' : '#EF4444'

  const complianceGrad = compliance === null
    ? 'linear-gradient(135deg, #475569 0%, #334155 100%)'
    : compliance >= 75 ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    : compliance >= 50 ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'

  type Trend = 'up' | 'down' | null
  const KPI_CARDS = [
    {
      label: 'Atletas activos', value: stats?.activeAthletes ?? 0, suffix: '', sub: 'Total registrados',
      grad: `linear-gradient(135deg, ${ACCENT} 0%, ${VIOLET} 100%)`,
      shadow: '0 8px 28px rgba(99,102,241,0.35)', shadowHover: '0 16px 44px rgba(99,102,241,0.50)',
      icon: Users, href: '/dashboard/atletas', trend: null as Trend, textColor: '#fff',
    },
    {
      label: 'Sesiones', value: stats?.weekSessions ?? 0, suffix: '', sub: 'Esta semana',
      grad: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
      shadow: '0 8px 28px rgba(6,182,212,0.30)', shadowHover: '0 16px 44px rgba(6,182,212,0.45)',
      icon: CalendarDays, href: '/dashboard/calendario', trend: null as Trend, textColor: '#fff',
    },
    {
      label: 'Cumplimiento', value: compliance, suffix: '%', sub: 'Último mes',
      grad: complianceGrad, shadow: '0 8px 28px rgba(0,0,0,0.25)', shadowHover: '0 16px 44px rgba(0,0,0,0.35)',
      icon: Activity, href: '/dashboard/reportes',
      trend: (compliance !== null ? (compliance >= 75 ? 'up' : 'down') : null) as Trend,
      textColor: '#fff',
    },
    {
      label: 'En riesgo', value: atRisk, suffix: '', sub: atRisk === 0 ? 'Todo en orden' : 'Requieren atención',
      grad: atRisk === 0 ? `linear-gradient(135deg, ${LIME} 0%, #84CC16 100%)` : 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
      shadow: atRisk === 0 ? '0 8px 28px rgba(198,255,0,0.22)' : '0 8px 28px rgba(239,68,68,0.28)',
      shadowHover: atRisk === 0 ? '0 16px 44px rgba(198,255,0,0.38)' : '0 16px 44px rgba(239,68,68,0.44)',
      icon: AlertTriangle, href: '/dashboard/reportes', trend: null as Trend,
      textColor: atRisk === 0 ? DARK_BG : '#fff',
    },
  ]

  // Build current week
  const todayDate = new Date()
  const dow = todayDate.getDay()
  const mondayOffset = dow === 0 ? -6 : 1 - dow
  const monday = new Date(todayDate)
  monday.setDate(todayDate.getDate() + mondayOffset)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const ds = d.toISOString().split('T')[0]
    return { label: DAY_LABELS[i], dateStr: ds, isToday: ds === todayStr, isPast: ds < todayStr }
  })

  const weekday = todayDate.toLocaleDateString('es-CL', { weekday: 'long' })
  const dateLabel = todayDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 14 }}>
        {KPI_CARDS.map(kpi => {
          const Icon = kpi.icon; const col = kpi.textColor
          return (
            <Link key={kpi.label} href={kpi.href} style={{
              textDecoration: 'none', display: 'block',
              padding: '22px 22px 18px', background: kpi.grad, borderRadius: 18,
              boxShadow: kpi.shadow,
              transition: 'transform 0.18s cubic-bezier(0.16,1,0.3,1), box-shadow 0.18s',
              position: 'relative', overflow: 'hidden',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = kpi.shadowHover }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = kpi.shadow }}
            >
              <span style={{ position: 'absolute', top: -24, right: -24, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
              <span style={{ position: 'absolute', bottom: -28, right: 16, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
              <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon size={18} color={col} strokeWidth={2.2} />
              </div>
              <p style={{ fontSize: 44, fontWeight: 800, color: col, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 8 }}>
                {kpi.value !== null ? `${kpi.value}${kpi.suffix}` : '—'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: col, opacity: 0.95 }}>{kpi.label}</p>
                {kpi.trend === 'up' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 700, color: col, background: 'rgba(255,255,255,0.22)', padding: '1px 7px', borderRadius: 999 }}><ChevronUp size={10} strokeWidth={3} />Bien</span>}
                {kpi.trend === 'down' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 700, color: col, background: 'rgba(255,255,255,0.22)', padding: '1px 7px', borderRadius: 999 }}><ChevronDown size={10} strokeWidth={3} />Bajo</span>}
              </div>
              <p style={{ fontSize: 11, color: col, opacity: 0.60 }}>{kpi.sub}</p>
            </Link>
          )
        })}
      </div>

      {/* ── Two-column: WOD + Sidebar widgets ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 286px', gap: 14, alignItems: 'start' }}>

        {/* WOD del día */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={15} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>WOD del día</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-3)', textTransform: 'capitalize' }}>{weekday}, {dateLabel}</p>
              </div>
            </div>
            <Link href="/dashboard/programacion" style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontWeight: 700, color: ACCENT, textDecoration: 'none',
              padding: '5px 12px', border: `1px solid ${ACCENT}33`, borderRadius: 8,
              background: 'rgba(99,102,241,0.06)', transition: 'background 0.1s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.12)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.06)'}
            >
              <Plus size={12} strokeWidth={2.5} />Programar
            </Link>
          </div>

          <div style={{ padding: 20 }}>
            {todaySchedule.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0 28px' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
                  background: `linear-gradient(135deg, ${ACCENT}20, ${VIOLET}20)`,
                  border: `2px dashed ${ACCENT}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Zap size={28} color={ACCENT} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 6, letterSpacing: '-0.03em' }}>Sin WOD programado</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 22, lineHeight: 1.65 }}>No hay entrenamiento asignado para hoy.</p>
                <Link href="/dashboard/programacion" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`,
                  color: '#fff', padding: '9px 22px', borderRadius: 10,
                  fontSize: 13.5, fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                }}>
                  Programar entrenamiento <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todaySchedule.map(entry => {
                  const isWod = !!entry.wod
                  const name = entry.wod?.name ?? entry.routine?.name ?? 'Sin nombre'
                  const type = entry.wod?.type
                  const accent = type ? (WOD_TYPE_COLORS[type] ?? ACCENT) : ACCENT
                  const bg = type ? (WOD_TYPE_BG[type] ?? 'rgba(99,102,241,0.08)') : 'rgba(99,102,241,0.08)'
                  const href = isWod && entry.wod_id ? `/dashboard/wods/${entry.wod_id}` : '/dashboard/programacion'
                  const wod = entry.wod as any
                  return (
                    <Link key={entry.id} href={href} style={{ textDecoration: 'none' }}>
                      <div style={{
                        border: '1px solid var(--color-border)', borderLeft: `4px solid ${accent}`,
                        borderRadius: 12, padding: '16px 18px',
                        transition: 'transform 0.12s, box-shadow 0.12s',
                      }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateX(3px)'; el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)' }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateX(0)'; el.style.boxShadow = 'none' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 42, height: 42, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {isWod ? <Zap size={18} color={accent} /> : <Dumbbell size={18} color={accent} />}
                            </div>
                            <div>
                              <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>{name}</p>
                              {entry.group && <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}><Users size={10} />{entry.group.name}</p>}
                            </div>
                          </div>
                          {type && (
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 20, background: bg, color: accent, border: `1px solid ${accent}44`, flexShrink: 0 }}>
                              {type.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        {wod && (
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {wod.time_cap_s && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} color="var(--color-text-3)" /><span style={{ fontSize: 11.5, color: 'var(--color-text-3)', fontWeight: 500 }}>{Math.floor(wod.time_cap_s / 60)}min</span></div>}
                            {wod.rounds && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><RotateCcw size={11} color="var(--color-text-3)" /><span style={{ fontSize: 11.5, color: 'var(--color-text-3)', fontWeight: 500 }}>{wod.rounds} rondas</span></div>}
                            {wod.movements?.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Dumbbell size={11} color="var(--color-text-3)" /><span style={{ fontSize: 11.5, color: 'var(--color-text-3)', fontWeight: 500 }}>{wod.movements.length} movimientos</span></div>}
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Compliance ring */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
              <span style={{ display: 'inline-block', width: 3, height: 13, borderRadius: 2, background: complianceColor }} />
              <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)' }}>Cumplimiento global</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              {/* Conic ring */}
              <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: compliance !== null
                    ? `conic-gradient(${complianceColor} ${compliance}%, var(--color-surface-2) ${compliance}%)`
                    : 'var(--color-surface-2)',
                }} />
                {/* Inner circle */}
                <div style={{
                  position: 'absolute', inset: 9, borderRadius: '50%',
                  background: 'var(--color-surface)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: 0,
                }}>
                  <p style={{ fontSize: 17, fontWeight: 800, color: complianceColor, letterSpacing: '-0.05em', lineHeight: 1 }}>
                    {compliance !== null ? compliance : '—'}
                  </p>
                  {compliance !== null && <p style={{ fontSize: 8.5, color: 'var(--color-text-3)', fontWeight: 600, marginTop: 1 }}>%</p>}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 24, fontWeight: 800, color: complianceColor, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 5 }}>
                  {compliance !== null ? `${compliance}%` : '—'}
                </p>
                <p style={{ fontSize: 11.5, color: 'var(--color-text-3)', lineHeight: 1.5 }}>
                  {compliance === null ? 'Sin datos' : compliance >= 75 ? 'Excelente' : compliance >= 50 ? 'Regular' : 'Necesita atención'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 2 }}>último mes</p>
              </div>
            </div>
          </div>

          {/* Week calendar */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ display: 'inline-block', width: 3, height: 13, borderRadius: 2, background: ACCENT, marginRight: 7 }} />
              <p style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-text)', flex: 1 }}>Esta semana</p>
              <span style={{ fontSize: 12, color: ACCENT, fontWeight: 700 }}>{stats?.weekSessions ?? 0}<span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-3)' }}> ses.</span></span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
              {weekDays.map((d, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: '100%', aspectRatio: '1', borderRadius: 8,
                    background: d.isToday
                      ? `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`
                      : d.isPast ? 'rgba(99,102,241,0.18)' : 'var(--color-surface-2)',
                    border: d.isToday ? 'none' : '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: d.isToday ? `0 2px 10px rgba(99,102,241,0.40)` : 'none',
                    transition: 'transform 0.1s',
                  }}>
                    {d.isToday && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                    {!d.isToday && d.isPast && <div style={{ width: 5, height: 5, borderRadius: '50%', background: ACCENT, opacity: 0.65 }} />}
                  </div>
                  <p style={{ fontSize: 9, fontWeight: d.isToday ? 800 : 500, color: d.isToday ? ACCENT : 'var(--color-text-3)' }}>{d.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            {[
              { label: 'Atletas activos', value: stats?.activeAthletes ?? 0, valueColor: ACCENT, href: '/dashboard/atletas' },
              { label: 'En riesgo', value: atRisk, valueColor: atRisk === 0 ? '#10B981' : '#EF4444', href: '/dashboard/reportes' },
            ].map((item, i) => (
              <Link key={item.label} href={item.href} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 18px', textDecoration: 'none',
                borderBottom: i === 0 ? '1px solid var(--color-border)' : 'none',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <p style={{ fontSize: 12.5, color: 'var(--color-text-2)', fontWeight: 500 }}>{item.label}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: item.valueColor, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{item.value}</p>
                  <ArrowRight size={12} color="var(--color-text-3)" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Atletas en riesgo — BankDash table ── */}
      {atRiskAthletes.length > 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 3, height: 14, borderRadius: 2, background: '#EF4444' }} />
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)' }}>Atletas en riesgo</p>
              <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#EF4444', padding: '2px 8px', borderRadius: 999 }}>
                {atRiskAthletes.length}
              </span>
            </div>
            <Link href="/dashboard/reportes" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: ACCENT, textDecoration: 'none' }}>
              Ver reporte <ArrowRight size={11} strokeWidth={2.5} />
            </Link>
          </div>

          {/* Column headers */}
          {!isMobile && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 130px 90px 120px',
              padding: '8px 20px', background: 'var(--color-bg)',
              borderBottom: '1px solid var(--color-border)',
              fontSize: 10, fontWeight: 700, color: 'var(--color-text-3)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              <span>Atleta</span>
              <span>Días inactivo</span>
              <span>Urgencia</span>
              <span>Nivel de riesgo</span>
            </div>
          )}

          {atRiskAthletes.slice(0, 6).map((a, i) => {
            const days = a.days_since_last_workout ?? 0
            const urgency = Math.min(days / 21, 1)
            const riskCfg = days >= 14
              ? { color: '#EF4444', bg: 'rgba(239,68,68,0.10)', bar: '#EF4444', label: 'Alto riesgo' }
              : days >= 7
              ? { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', bar: '#F59E0B', label: 'Riesgo medio' }
              : { color: '#818CF8', bg: 'rgba(129,140,248,0.10)', bar: '#818CF8', label: 'Riesgo bajo' }

            return (
              <Link
                key={a.athlete_id}
                href={`/dashboard/atletas/${a.athlete_id}`}
                style={{
                  display: isMobile ? 'flex' : 'grid',
                  gridTemplateColumns: isMobile ? undefined : '1fr 130px 90px 120px',
                  alignItems: 'center',
                  padding: '12px 20px',
                  borderBottom: i < Math.min(atRiskAthletes.length, 6) - 1 ? '1px solid var(--color-border)' : 'none',
                  textDecoration: 'none',
                  transition: 'background 0.1s',
                  gap: isMobile ? 12 : 0,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {/* Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff',
                  }}>
                    {a.first_name?.[0]}{a.last_name?.[0]}
                  </div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>
                    {a.first_name} {a.last_name}
                  </p>
                </div>
                {/* Days count */}
                {!isMobile && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: riskCfg.color, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{days}</p>
                    <p style={{ fontSize: 10.5, color: 'var(--color-text-3)', fontWeight: 500 }}>días</p>
                  </div>
                )}
                {/* Urgency bar */}
                {!isMobile && (
                  <div>
                    <div style={{ width: 64, height: 5, borderRadius: 3, background: 'var(--color-surface-2)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${urgency * 100}%`, background: riskCfg.bar, borderRadius: 3, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )}
                {/* Badge */}
                <span style={{
                  fontSize: 11.5, fontWeight: 700, color: riskCfg.color, background: riskCfg.bg,
                  padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap',
                  justifySelf: 'start' as const,
                }}>
                  {isMobile && `${days}d · `}{riskCfg.label}
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {atRiskAthletes.length === 0 && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '52px 24px', textAlign: 'center' }}>
          <div style={{ width: 58, height: 58, borderRadius: 16, background: 'rgba(198,255,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <TrendingUp size={28} color={LIME} />
          </div>
          <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8, letterSpacing: '-0.02em' }}>Todo en orden</p>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-3)', maxWidth: 320, margin: '0 auto 24px', lineHeight: 1.65 }}>
            Comienza agregando atletas y asignando entrenamientos para ver métricas aquí.
          </p>
          <Link href="/dashboard/atletas" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`, color: '#fff',
            padding: '10px 24px', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
            textDecoration: 'none', boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
          }}>
            Agregar atleta <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  )
}

function RiskBadge({ days }: { days: number | null }) {
  if (days === null) return null
  const cfg = days >= 14
    ? { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', label: 'Alto riesgo' }
    : days >= 7
    ? { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Riesgo medio' }
    : { color: '#818CF8', bg: 'rgba(129,140,248,0.12)', label: 'Riesgo bajo' }
  return (
    <span style={{ fontSize: 11.5, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  )
}

function StatsSkeleton({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 14 }}>
        {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 148, borderRadius: 18 }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 286px', gap: 14 }}>
        <div className="skeleton" style={{ height: 240, borderRadius: 16 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="skeleton" style={{ height: 130, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 90, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 80, borderRadius: 16 }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 220, borderRadius: 16 }} />
    </div>
  )
}
