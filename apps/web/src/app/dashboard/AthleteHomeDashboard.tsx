'use client'

import { useQuery } from '@tanstack/react-query'
import { getMyAthlete } from '@/lib/queries/athletes'
import { getSessionsByAthlete } from '@/lib/queries/sessions'
import { getLatestPRs } from '@/lib/queries/prs'
import { getAthleteWodResults, SCALE_LABELS, SCALE_COLORS, buildResultText } from '@/lib/queries/wod-results'
import { getBoxScheduleRange } from '@/lib/queries/box-schedule'
import Link from 'next/link'
import { Zap, Dumbbell, Trophy, ArrowRight, CheckCircle2, Target, Flame } from 'lucide-react'

const WOD_TYPE_COLORS: Record<string, string> = {
  amrap: '#1D4ED8', emom: '#6D28D9', for_time: '#C2410C',
  tabata: '#9D174D', chipper: '#15803D', intervals: '#B45309', custom: '#475569',
}
const WOD_TYPE_BG: Record<string, string> = {
  amrap: '#EFF6FF', emom: '#F5F3FF', for_time: '#FFF7ED',
  tabata: '#FDF2F8', chipper: '#F0FDF4', intervals: '#FFFBEB', custom: '#F8FAFC',
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante', intermediate: 'Intermedio',
  advanced: 'Avanzado', competitive: 'Competitivo',
}
const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  beginner:     { bg: '#F0FDF4', text: '#16A34A' },
  intermediate: { bg: '#EFF6FF', text: '#1D4ED8' },
  advanced:     { bg: '#FFF7ED', text: '#C2410C' },
  competitive:  { bg: '#FDF2F8', text: '#9D174D' },
}

export function AthleteHomeDashboard() {
  const todayStr = new Date().toISOString().split('T')[0]
  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: me } = useQuery({
    queryKey: ['my-athlete'],
    queryFn: getMyAthlete,
  })

  const { data: todaySchedule = [] } = useQuery({
    queryKey: ['box-schedule-today', todayStr],
    queryFn: () => getBoxScheduleRange(todayStr, todayStr),
  })

  const { data: sessions = [] } = useQuery({
    queryKey: ['my-sessions', me?.id],
    queryFn: () => me ? getSessionsByAthlete(me.id, thirtyAgo) : Promise.resolve([]),
    enabled: !!me,
  })

  const { data: prs = [] } = useQuery({
    queryKey: ['my-prs', me?.id],
    queryFn: () => me ? getLatestPRs(me.id) : Promise.resolve([]),
    enabled: !!me,
  })

  const { data: wodResults = [] } = useQuery({
    queryKey: ['my-wod-results', me?.id],
    queryFn: () => me ? getAthleteWodResults(me.id, 10) : Promise.resolve([]),
    enabled: !!me,
  })

  const completed   = sessions.filter(s => s.status === 'completed').length
  const total       = sessions.length
  const compliance  = total > 0 ? Math.round((completed / total) * 100) : null

  // Streak: consecutive days with a completed session ending today or yesterday
  const streak = (() => {
    const completedDates = new Set(
      sessions.filter(s => s.status === 'completed').map(s => s.scheduled_date)
    )
    let count = 0
    const d = new Date()
    for (let i = 0; i < 60; i++) {
      const ds = d.toISOString().split('T')[0]
      if (completedDates.has(ds)) { count++; d.setDate(d.getDate() - 1) }
      else if (i === 0) { d.setDate(d.getDate() - 1) } // allow today to be incomplete
      else break
    }
    return count
  })()

  const lc = me?.sport_level ? LEVEL_COLORS[me.sport_level] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Athlete identity strip */}
      {me && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 14, padding: '18px 24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #E53E3E 0%, #B91C1C 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em',
          }}>
            {me.first_name[0]}{me.last_name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
              {me.first_name} {me.last_name}
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              {me.sport_level && lc && (
                <span style={{ fontSize: 11, fontWeight: 700, background: lc.bg, color: lc.text, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {LEVEL_LABELS[me.sport_level]}
                </span>
              )}
              {me.primary_sport && (
                <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 500 }}>{me.primary_sport}</span>
              )}
            </div>
          </div>
          <Link href="/dashboard/calculadora" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12.5, fontWeight: 600, color: 'var(--color-red)',
            textDecoration: 'none', background: '#FFF5F5', border: '1px solid #FED7D7',
            borderRadius: 8, padding: '7px 12px',
          }}>
            <Target size={13} />
            Mis PRs
          </Link>
        </div>
      )}

      {/* WOD del día */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
            Entrenamiento de hoy
          </p>
        </div>
        {todaySchedule.length === 0 ? (
          <div style={{
            background: 'var(--color-surface)', border: '1.5px dashed var(--color-border)',
            borderRadius: 14, padding: '32px 24px', textAlign: 'center',
          }}>
            <Zap size={24} color="#CBD5E1" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-2)' }}>Sin WOD programado hoy</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 4 }}>Consulta con tu coach.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todaySchedule.map(entry => {
              const isWod = !!entry.wod
              const name = entry.wod?.name ?? entry.routine?.name ?? 'Sin nombre'
              const type = entry.wod?.type
              const accent = type ? (WOD_TYPE_COLORS[type] ?? '#475569') : '#6366F1'
              const bg = type ? (WOD_TYPE_BG[type] ?? '#F8FAFC') : '#EEF2FF'
              const href = isWod && entry.wod_id ? `/dashboard/wods/${entry.wod_id}` : '#'

              return (
                <Link key={entry.id} href={href} style={{
                  display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none',
                  background: 'var(--color-surface)', border: `1px solid ${accent}33`,
                  borderLeft: `4px solid ${accent}`, borderRadius: 14, padding: '20px 24px',
                  transition: 'box-shadow 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isWod ? <Zap size={22} color={accent} /> : <Dumbbell size={22} color={accent} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>{name}</p>
                      {type && (
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 20, background: bg, color: accent, border: `1px solid ${accent}33` }}>
                          {type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    {entry.notes && <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{entry.notes}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: accent, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    Ver WOD <ArrowRight size={15} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* KPIs personales */}
      <div>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em', marginBottom: 14 }}>
          Mi mes
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            {
              icon: <CheckCircle2 size={18} />,
              label: 'Completadas',
              value: completed,
              sub: 'últimos 30 días',
              color: '#16A34A',
            },
            {
              icon: <Target size={18} />,
              label: 'Cumplimiento',
              value: compliance !== null ? `${compliance}%` : '—',
              sub: `${total} sesiones totales`,
              color: compliance === null ? '#94A3B8' : compliance >= 75 ? '#16A34A' : compliance >= 50 ? '#D97706' : '#DC2626',
            },
            {
              icon: <Flame size={18} />,
              label: 'Racha actual',
              value: streak > 0 ? streak : '—',
              sub: streak > 0 ? `día${streak > 1 ? 's' : ''} consecutivo${streak > 1 ? 's' : ''}` : 'sin racha activa',
              color: streak >= 7 ? '#E53E3E' : streak >= 3 ? '#D97706' : '#0F172A',
            },
          ].map(k => (
            <div key={k.label} style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 14, padding: '20px 20px 18px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, color: k.color }}>
                {k.icon}
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{k.label}</span>
              </div>
              <p style={{ fontSize: 36, fontWeight: 800, color: k.color, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 6 }}>
                {k.value}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PRs + WOD Results grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Mis PRs */}
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Dumbbell size={14} color="#E53E3E" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Mis PRs</span>
            </div>
            <Link href="/dashboard/calculadora" style={{ fontSize: 12, color: 'var(--color-red)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver todos <ArrowRight size={11} />
            </Link>
          </div>
          {prs.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Sin PRs registrados aún.</p>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {prs.slice(0, 6).map((pr, i) => (
                <div key={pr.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 20px',
                  borderBottom: i < Math.min(prs.length, 6) - 1 ? '1px solid var(--color-border)' : 'none',
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{pr.movement_name}</p>
                    {pr.reps > 1 && pr.estimated_1rm && (
                      <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 1 }}>
                        {pr.weight_kg}kg × {pr.reps} reps
                      </p>
                    )}
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                    {pr.estimated_1rm ?? pr.weight_kg}
                    <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-3)', marginLeft: 2 }}>kg</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mis últimos WODs */}
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={14} color="#F97316" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Mis resultados WODs</span>
            </div>
            <Link href="/dashboard/wods" style={{ fontSize: 12, color: 'var(--color-red)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver WODs <ArrowRight size={11} />
            </Link>
          </div>
          {wodResults.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Sin resultados registrados aún.</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 4 }}>Guarda tu resultado al terminar un WOD.</p>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {wodResults.slice(0, 6).map((r, i) => {
                const sc = SCALE_COLORS[r.scale]
                const display = buildResultText(r)
                return (
                  <div key={r.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
                    borderBottom: i < Math.min(wodResults.length, 6) - 1 ? '1px solid var(--color-border)' : 'none',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                        {(r as any).wod_name ?? 'WOD'}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 1 }}>
                        {new Date(r.recorded_at + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    {display && (
                      <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                        {display}
                      </p>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, border: `1px solid ${sc.border}`, background: sc.bg, color: sc.text, flexShrink: 0 }}>
                      {SCALE_LABELS[r.scale]}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Historial de sesiones reciente */}
      {sessions.length > 0 && (
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em', marginBottom: 14 }}>
            Historial reciente
          </p>
          <div style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            {sessions.slice(-8).reverse().map((s, i, arr) => {
              const label = (s as any).wod?.name ?? (s as any).routine?.name ?? (s.type === 'rest' ? 'Descanso' : 'Evento')
              const isCompleted = s.status === 'completed'
              const isSkipped   = s.status === 'skipped'
              const dotColor    = isCompleted ? '#16A34A' : isSkipped ? '#CBD5E1' : '#3B82F6'

              return (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{label}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 1 }}>
                      {new Date(s.scheduled_date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                    background: isCompleted ? '#F0FDF4' : isSkipped ? '#F8FAFC' : '#EFF6FF',
                    color: isCompleted ? '#16A34A' : isSkipped ? '#94A3B8' : '#1D4ED8',
                  }}>
                    {isCompleted ? 'Completado' : isSkipped ? 'Saltado' : 'Programado'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
