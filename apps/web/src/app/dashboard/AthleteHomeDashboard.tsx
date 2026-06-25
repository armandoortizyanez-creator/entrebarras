'use client'

import { useQuery } from '@tanstack/react-query'
import { getMyAthlete } from '@/lib/queries/athletes'
import { getSessionsByAthlete } from '@/lib/queries/sessions'
import { getLatestPRs } from '@/lib/queries/prs'
import { getAthleteWodResults, SCALE_LABELS, SCALE_COLORS, buildResultText } from '@/lib/queries/wod-results'
import { getBoxScheduleRange } from '@/lib/queries/box-schedule'
import Link from 'next/link'
import { Zap, Dumbbell, Trophy, ArrowRight, CheckCircle2, Target, Flame } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

const ACCENT = '#6366F1'
const VIOLET = '#7C3AED'
const LIME   = '#C6FF00'

const WOD_TYPE_COLORS: Record<string, string> = {
  amrap: '#818CF8', emom: '#A78BFA', for_time: '#C6FF00',
  tabata: '#F472B6', chipper: '#34D399', intervals: '#FBBF24', custom: '#8A93A8',
}
const WOD_TYPE_COLORS_LIGHT: Record<string, string> = {
  ...WOD_TYPE_COLORS, for_time: '#4A5500',
}
const WOD_TYPE_BG: Record<string, string> = {
  amrap: 'rgba(129,140,248,0.12)', emom: 'rgba(167,139,250,0.12)', for_time: 'rgba(198,255,0,0.10)',
  tabata: 'rgba(244,114,182,0.10)', chipper: 'rgba(52,211,153,0.10)', intervals: 'rgba(251,191,36,0.10)', custom: 'rgba(138,147,168,0.10)',
}
const WOD_TYPE_BG_LIGHT: Record<string, string> = {
  ...WOD_TYPE_BG, for_time: 'rgba(74,85,0,0.08)',
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante', intermediate: 'Intermedio',
  advanced: 'Avanzado', competitive: 'Competitivo',
}
const LEVEL_COLORS: Record<string, { color: string; bg: string }> = {
  beginner:     { color: '#4ADE80', bg: 'rgba(74,222,128,0.12)' },
  intermediate: { color: '#818CF8', bg: 'rgba(129,140,248,0.12)' },
  advanced:     { color: '#FB923C', bg: 'rgba(251,146,60,0.12)' },
  competitive:  { color: '#F472B6', bg: 'rgba(244,114,182,0.12)' },
}

export function AthleteHomeDashboard() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const todayStr = new Date().toISOString().split('T')[0]
  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: me } = useQuery({ queryKey: ['my-athlete'], queryFn: getMyAthlete })

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

  const completed  = sessions.filter(s => s.status === 'completed').length
  const total      = sessions.length
  const compliance = total > 0 ? Math.round((completed / total) * 100) : null

  const streak = (() => {
    const completedDates = new Set(
      sessions.filter(s => s.status === 'completed').map(s => s.scheduled_date)
    )
    let count = 0
    const d = new Date()
    for (let i = 0; i < 60; i++) {
      const ds = d.toISOString().split('T')[0]
      if (completedDates.has(ds)) { count++; d.setDate(d.getDate() - 1) }
      else if (i === 0) { d.setDate(d.getDate() - 1) }
      else break
    }
    return count
  })()

  const lc = me?.sport_level ? LEVEL_COLORS[me.sport_level] : null

  const complianceColor = compliance === null ? 'var(--color-text-2)'
    : compliance >= 75 ? '#4ADE80'
    : compliance >= 50 ? '#FBBF24'
    : '#F87171'

  const streakColor = streak >= 7 ? LIME : streak >= 3 ? '#FBBF24' : 'var(--color-text-2)'

  // Gradient KPI cards — always vibrant
  const KPI_CARDS = [
    {
      icon: CheckCircle2,
      label: 'Completadas',
      value: completed,
      suffix: '',
      sub: 'últimos 30 días',
      grad: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      shadow: '0 6px 20px rgba(16,185,129,0.30)',
      shadowH: '0 12px 32px rgba(16,185,129,0.45)',
    },
    {
      icon: Target,
      label: 'Cumplimiento',
      value: compliance,
      suffix: '%',
      sub: `${total} sesiones totales`,
      grad: compliance === null
        ? 'linear-gradient(135deg, #475569 0%, #334155 100%)'
        : compliance >= 75
        ? `linear-gradient(135deg, ${ACCENT} 0%, ${VIOLET} 100%)`
        : compliance >= 50
        ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
        : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      shadow: '0 6px 20px rgba(99,102,241,0.28)',
      shadowH: '0 12px 32px rgba(99,102,241,0.44)',
    },
    {
      icon: Flame,
      label: 'Racha',
      value: streak > 0 ? streak : null,
      suffix: '',
      sub: streak > 0 ? `día${streak !== 1 ? 's' : ''} consecutivo${streak !== 1 ? 's' : ''}` : 'sin racha activa',
      grad: streak >= 7
        ? `linear-gradient(135deg, ${LIME} 0%, #84CC16 100%)`
        : streak >= 3
        ? 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)'
        : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
      shadow: streak >= 3 ? '0 6px 20px rgba(198,255,0,0.22)' : '0 6px 20px rgba(0,0,0,0.20)',
      shadowH: streak >= 3 ? '0 12px 32px rgba(198,255,0,0.36)' : '0 12px 32px rgba(0,0,0,0.30)',
      textDark: streak >= 7,
    },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Athlete identity strip ── */}
      {me && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 16, padding: '18px 24px',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${ACCENT} 0%, ${VIOLET} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em',
            boxShadow: '0 4px 14px rgba(99,102,241,0.40)',
          }}>
            {me.first_name[0]}{me.last_name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
              {me.first_name} {me.last_name}
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
              {me.sport_level && lc && (
                <span style={{ fontSize: 11, fontWeight: 700, background: lc.bg, color: lc.color, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {LEVEL_LABELS[me.sport_level]}
                </span>
              )}
              {me.primary_sport && (
                <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 500 }}>{me.primary_sport}</span>
              )}
            </div>
          </div>
          <Link
            href="/dashboard/calculadora"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12.5, fontWeight: 700, color: '#fff',
              textDecoration: 'none',
              background: `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`,
              borderRadius: 10, padding: '8px 14px',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
            }}
          >
            <Target size={13} />
            Mis PRs
          </Link>
        </div>
      )}

      {/* ── WOD del día ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ display: 'inline-block', width: 4, height: 18, borderRadius: 2, background: `linear-gradient(${ACCENT}, ${VIOLET})` }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            Entrenamiento de hoy
          </p>
        </div>

        {todaySchedule.length === 0 ? (
          <div style={{
            background: 'var(--color-surface)', border: '1.5px dashed var(--color-border)',
            borderRadius: 16, padding: '32px 24px', textAlign: 'center',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(99,102,241,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Zap size={22} color={ACCENT} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-2)' }}>Sin WOD programado hoy</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 4 }}>Consulta con tu coach.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todaySchedule.map(entry => {
              const isWod = !!entry.wod
              const name = entry.wod?.name ?? entry.routine?.name ?? 'Sin nombre'
              const type = entry.wod?.type
              const colorMap = isLight ? WOD_TYPE_COLORS_LIGHT : WOD_TYPE_COLORS
              const bgMap = isLight ? WOD_TYPE_BG_LIGHT : WOD_TYPE_BG
              const accent = type ? (colorMap[type] ?? '#818CF8') : ACCENT
              const bg = type ? (bgMap[type] ?? 'rgba(99,102,241,0.08)') : 'rgba(99,102,241,0.08)'
              const href = isWod && entry.wod_id ? `/dashboard/wods/${entry.wod_id}` : '#'

              return (
                <Link
                  key={entry.id}
                  href={href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderLeft: `4px solid ${accent}`,
                    borderRadius: 14, padding: '18px 24px',
                    transition: 'box-shadow 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.boxShadow = 'var(--shadow-card-hover)'
                    el.style.transform = 'translateX(3px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.boxShadow = 'none'
                    el.style.transform = 'translateX(0)'
                  }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 13, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isWod ? <Zap size={22} color={accent} /> : <Dumbbell size={22} color={accent} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>{name}</p>
                      {type && (
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20, background: bg, color: accent, border: `1px solid ${accent}33` }}>
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

      {/* ── KPIs personales — gradient cards ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ display: 'inline-block', width: 4, height: 18, borderRadius: 2, background: `linear-gradient(${ACCENT}, ${VIOLET})` }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Mi mes</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {KPI_CARDS.map(k => {
            const Icon = k.icon
            const textDark = 'textDark' in k && k.textDark
            const col = textDark ? '#0D1117' : '#fff'
            return (
              <div
                key={k.label}
                style={{
                  background: k.grad,
                  borderRadius: 16, padding: '20px 18px 16px',
                  boxShadow: k.shadow,
                  transition: 'transform 0.18s cubic-bezier(0.16,1,0.3,1), box-shadow 0.18s',
                  position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'translateY(-3px)'
                  el.style.boxShadow = k.shadowH
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = k.shadow
                }}
              >
                <span style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={18} color={col} strokeWidth={2.2} />
                </div>
                <p style={{ fontSize: 38, fontWeight: 800, color: col, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 6 }}>
                  {k.value !== null ? `${k.value}${k.suffix}` : '—'}
                </p>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: col, opacity: 0.9, marginBottom: 2 }}>{k.label}</p>
                <p style={{ fontSize: 11, color: col, opacity: 0.60 }}>{k.sub}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── PRs + WOD Results grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Mis PRs */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 3, height: 14, borderRadius: 2, background: LIME }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Mis PRs</span>
            </div>
            <Link href="/dashboard/calculadora" style={{ fontSize: 12, color: ACCENT, textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver todos <ArrowRight size={11} />
            </Link>
          </div>
          {prs.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <Dumbbell size={24} color="var(--color-text-4)" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Sin PRs registrados aún.</p>
            </div>
          ) : (
            <div style={{ padding: '6px 0' }}>
              {prs.slice(0, 6).map((pr, i) => (
                <div
                  key={pr.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 20px',
                    borderBottom: i < Math.min(prs.length, 6) - 1 ? '1px solid var(--color-border)' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
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
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 3, height: 14, borderRadius: 2, background: '#F97316' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Mis resultados WODs</span>
            </div>
            <Link href="/dashboard/wods" style={{ fontSize: 12, color: ACCENT, textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver WODs <ArrowRight size={11} />
            </Link>
          </div>
          {wodResults.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <Trophy size={24} color="var(--color-text-4)" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Sin resultados registrados aún.</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 4 }}>Guarda tu resultado al terminar un WOD.</p>
            </div>
          ) : (
            <div style={{ padding: '6px 0' }}>
              {wodResults.slice(0, 6).map((r, i) => {
                const sc = SCALE_COLORS[r.scale]
                const display = buildResultText(r)
                return (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
                      borderBottom: i < Math.min(wodResults.length, 6) - 1 ? '1px solid var(--color-border)' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
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

      {/* ── Historial reciente ── */}
      {sessions.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ display: 'inline-block', width: 4, height: 18, borderRadius: 2, background: `linear-gradient(${ACCENT}, ${VIOLET})` }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              Historial reciente
            </p>
          </div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            {sessions.slice(-8).reverse().map((s, i, arr) => {
              const label = (s as any).wod?.name ?? (s as any).routine?.name ?? (s.type === 'rest' ? 'Descanso' : 'Evento')
              const isCompleted = s.status === 'completed'
              const isSkipped   = s.status === 'skipped'

              const dotColor = isCompleted ? '#4ADE80' : isSkipped ? 'var(--color-text-4)' : '#818CF8'
              const chipBg   = isCompleted ? 'rgba(74,222,128,0.12)' : isSkipped ? 'var(--color-surface-2)' : 'rgba(129,140,248,0.12)'
              const chipCol  = isCompleted ? '#4ADE80' : isSkipped ? 'var(--color-text-3)' : '#818CF8'
              const chipLbl  = isCompleted ? 'Completado' : isSkipped ? 'Saltado' : 'Programado'

              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0, boxShadow: isCompleted ? '0 0 6px rgba(74,222,128,0.50)' : 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{label}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 1 }}>
                      {new Date(s.scheduled_date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: chipBg, color: chipCol }}>
                    {chipLbl}
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
