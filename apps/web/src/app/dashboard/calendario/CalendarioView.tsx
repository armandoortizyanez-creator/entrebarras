'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  getSessionsByMonth, createSession, deleteSession, updateSessionStatus,
  type TrainingSession,
} from '@/lib/queries/sessions'
import { getAthletes } from '@/lib/queries/athletes'
import { getRoutines } from '@/lib/queries/routines'
import { getWods } from '@/lib/queries/wods'

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'var(--color-info)',
  started: 'var(--color-warning)',
  completed: 'var(--color-success)',
  skipped: 'var(--color-text-4)',
}

const TYPE_COLORS: Record<string, string> = {
  routine: '#6366f1',
  wod: 'var(--color-red)',
  rest: 'var(--color-success)',
  event: 'var(--color-warning)',
}

export function CalendarioView() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showAssign, setShowAssign] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  const qc = useQueryClient()

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', year, month],
    queryFn: () => getSessionsByMonth(year, month),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TrainingSession['status'] }) =>
      updateSessionStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const sessionsByDate = sessions.reduce<Record<string, TrainingSession[]>>((acc, s) => {
    if (!acc[s.scheduled_date]) acc[s.scheduled_date] = []
    acc[s.scheduled_date].push(s)
    return acc
  }, {})

  const dateStr = (d: number) => `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const selectedSessions = selectedDate ? (sessionsByDate[selectedDate] ?? []) : []

  return (
    <div style={{ padding: isMobile ? '16px 16px 80px' : '32px 40px', maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 16 : 28 }}>
        <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
          Calendario
        </h1>
        <button
          onClick={() => { setShowAssign(true) }}
          style={{ background: 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: isMobile ? '8px 12px' : '9px 18px', fontSize: isMobile ? 12 : 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {isMobile ? '+ Asignar' : '+ Asignar entrenamiento'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Calendario */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {/* Header del mes */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-3)', padding: '4px 8px' }}>←</button>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>
              {MONTHS_ES[month - 1]} {year}
            </h2>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-3)', padding: '4px 8px' }}>→</button>
          </div>

          {/* Días de la semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--color-border)' }}>
            {DAYS_ES.map(d => (
              <div key={d} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Grilla de días */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {/* Celdas vacías del inicio */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: isMobile ? 52 : 88, borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }} />
            ))}

            {/* Días del mes */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const ds = dateStr(day)
              const daySessions = sessionsByDate[ds] ?? []
              const isToday = ds === todayStr
              const isSelected = ds === selectedDate
              const colIndex = (firstDay + day - 1) % 7
              const isLastCol = colIndex === 6

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(ds === selectedDate ? null : ds)}
                  style={{
                    minHeight: isMobile ? 52 : 88, padding: isMobile ? '4px' : '6px', cursor: 'pointer',
                    borderRight: isLastCol ? 'none' : '1px solid var(--color-border)',
                    borderBottom: '1px solid var(--color-border)',
                    background: isSelected ? 'var(--color-red-muted)' : isToday ? 'var(--color-surface-2)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{
                    width: isMobile ? 22 : 26, height: isMobile ? 22 : 26,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%', marginBottom: isMobile ? 2 : 4,
                    background: isToday ? 'var(--color-red)' : 'transparent',
                    fontSize: isMobile ? 11 : 13, fontWeight: isToday ? 700 : 400,
                    color: isToday ? '#fff' : isSelected ? 'var(--color-red)' : 'var(--color-text)',
                  }}>
                    {day}
                  </div>
                  {isMobile ? (
                    daySessions.length > 0 && (
                      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {daySessions.slice(0, 3).map(s => (
                          <div key={s.id} style={{ width: 6, height: 6, borderRadius: '50%', background: TYPE_COLORS[s.type], flexShrink: 0 }} />
                        ))}
                        {daySessions.length > 3 && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-text-4)' }} />}
                      </div>
                    )
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {daySessions.slice(0, 3).map(s => (
                        <div
                          key={s.id}
                          style={{
                            fontSize: 11, padding: '1px 5px', borderRadius: 3,
                            background: TYPE_COLORS[s.type] + '22',
                            color: TYPE_COLORS[s.type],
                            fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}
                        >
                          {s.athlete?.first_name} {s.athlete?.last_name?.[0]}.
                        </div>
                      ))}
                      {daySessions.length > 3 && (
                        <div style={{ fontSize: 10, color: 'var(--color-text-3)' }}>+{daySessions.length - 3} más</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Panel lateral */}
        <div>
          {/* Leyenda */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Tipos</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { type: 'routine', label: 'Rutina' },
                { type: 'wod', label: 'WOD' },
                { type: 'rest', label: 'Descanso' },
                { type: 'event', label: 'Evento' },
              ].map(({ type, label }) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: TYPE_COLORS[type], flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sesiones del día seleccionado */}
          {selectedDate ? (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <button
                  onClick={() => { setShowAssign(true) }}
                  style={{ fontSize: 12, color: 'var(--color-red)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                >
                  + Asignar
                </button>
              </div>

              {selectedSessions.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text-3)', fontSize: 13 }}>
                  Sin entrenamientos este día.
                </div>
              ) : (
                <div>
                  {selectedSessions.map((s, i) => (
                    <SessionItem
                      key={s.id}
                      session={s}
                      isLast={i === selectedSessions.length - 1}
                      onDelete={() => {
                        if (confirm('¿Eliminar esta sesión?')) deleteMutation.mutate(s.id)
                      }}
                      onStatusChange={(status) => statusMutation.mutate({ id: s.id, status })}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Selecciona un día para ver sus sesiones.</p>
            </div>
          )}
        </div>
      </div>

      {showAssign && (
        <AssignModal
          defaultDate={selectedDate ?? todayStr}
          onClose={() => setShowAssign(false)}
          onSuccess={() => {
            setShowAssign(false)
            qc.invalidateQueries({ queryKey: ['sessions'] })
          }}
        />
      )}
    </div>
  )
}

function SessionItem({ session, isLast, onDelete, onStatusChange }: {
  session: TrainingSession
  isLast: boolean
  onDelete: () => void
  onStatusChange: (s: TrainingSession['status']) => void
}) {
  const content = session.routine?.name ?? session.wod?.name ?? (session.type === 'rest' ? 'Descanso' : 'Evento')

  const statusLabels: Record<string, string> = {
    scheduled: 'Programado',
    started: 'En curso',
    completed: 'Completado',
    skipped: 'Saltado',
  }

  return (
    <div style={{ padding: '12px 16px', borderBottom: isLast ? 'none' : '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLORS[session.type], flexShrink: 0 }} />
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {content}
            </p>
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginBottom: 6 }}>
            {session.athlete?.first_name} {session.athlete?.last_name}
            {session.scheduled_time ? ` · ${session.scheduled_time.substring(0, 5)}` : ''}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={session.status}
              onChange={e => onStatusChange(e.target.value as TrainingSession['status'])}
              style={{
                fontSize: 11, padding: '3px 6px', borderRadius: 'var(--radius-sm)',
                border: `1px solid ${STATUS_COLORS[session.status]}`,
                color: STATUS_COLORS[session.status], background: 'transparent', cursor: 'pointer',
              }}
            >
              <option value="scheduled">Programado</option>
              <option value="started">En curso</option>
              <option value="completed">Completado</option>
              <option value="skipped">Saltado</option>
            </select>
            {(session.status === 'scheduled' || session.status === 'started') && (
              <Link
                href={`/dashboard/sesion/${session.id}`}
                style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-red)', color: '#fff', textDecoration: 'none',
                }}
              >
                ▶ Iniciar
              </Link>
            )}
          </div>
        </div>
        <button
          onClick={onDelete}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-4)', fontSize: 14, flexShrink: 0, padding: 2 }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

function AssignModal({ defaultDate, onClose, onSuccess }: {
  defaultDate: string; onClose: () => void; onSuccess: () => void
}) {
  const [form, setForm] = useState({
    athlete_id: '',
    type: 'routine' as 'routine' | 'wod' | 'rest' | 'event',
    routine_id: '',
    wod_id: '',
    scheduled_date: defaultDate,
    scheduled_time: '',
    notes: '',
    repeat: false,
    repeatDays: [] as string[],
    repeatUntil: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: athletes = [] } = useQuery({ queryKey: ['athletes'], queryFn: () => getAthletes() })
  const { data: routines = [] } = useQuery({ queryKey: ['routines'], queryFn: getRoutines })
  const { data: wods = [] } = useQuery({ queryKey: ['wods'], queryFn: getWods })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.athlete_id) return setError('Selecciona un atleta')
    if (form.type === 'routine' && !form.routine_id) return setError('Selecciona una rutina')
    if (form.type === 'wod' && !form.wod_id) return setError('Selecciona un WOD')

    setLoading(true)
    setError(null)
    try {
      const dates: string[] = [form.scheduled_date]

      if (form.repeat && form.repeatUntil && form.repeatDays.length > 0) {
        const end = new Date(form.repeatUntil)
        const cur = new Date(form.scheduled_date)
        cur.setDate(cur.getDate() + 1)
        while (cur <= end) {
          const dow = cur.getDay().toString()
          if (form.repeatDays.includes(dow)) {
            dates.push(cur.toISOString().split('T')[0])
          }
          cur.setDate(cur.getDate() + 1)
        }
      }

      for (const date of dates) {
        await createSession({
          athlete_id: form.athlete_id,
          type: form.type,
          scheduled_date: date,
          scheduled_time: form.scheduled_time || undefined,
          routine_id: form.type === 'routine' ? form.routine_id : undefined,
          wod_id: form.type === 'wod' ? form.wod_id : undefined,
          notes: form.notes || undefined,
        })
      }
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al asignar')
    } finally {
      setLoading(false)
    }
  }

  const WEEK_DAYS = [
    { value: '0', label: 'D' }, { value: '1', label: 'L' }, { value: '2', label: 'M' },
    { value: '3', label: 'X' }, { value: '4', label: 'J' }, { value: '5', label: 'V' }, { value: '6', label: 'S' },
  ]

  function toggleDay(v: string) {
    setForm(p => ({
      ...p,
      repeatDays: p.repeatDays.includes(v) ? p.repeatDays.filter(d => d !== v) : [...p.repeatDays, v],
    }))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 1 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>Asignar entrenamiento</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-3)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormSelect
            label="Atleta"
            value={form.athlete_id}
            onChange={v => setForm(p => ({ ...p, athlete_id: v }))}
            required
          >
            <option value="">Seleccionar atleta...</option>
            {athletes.map((a: any) => (
              <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
            ))}
          </FormSelect>

          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 8 }}>Tipo de sesión</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {([
                { value: 'routine', label: 'Rutina' },
                { value: 'wod', label: 'WOD' },
                { value: 'rest', label: 'Descanso' },
                { value: 'event', label: 'Evento' },
              ] as const).map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: t.value }))}
                  style={{
                    padding: '8px 4px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: `1.5px solid ${form.type === t.value ? TYPE_COLORS[t.value] : 'var(--color-border)'}`,
                    background: form.type === t.value ? TYPE_COLORS[t.value] + '18' : 'transparent',
                    fontSize: 12, fontWeight: 500,
                    color: form.type === t.value ? TYPE_COLORS[t.value] : 'var(--color-text-3)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {form.type === 'routine' && (
            <FormSelect label="Rutina" value={form.routine_id} onChange={v => setForm(p => ({ ...p, routine_id: v }))} required>
              <option value="">Seleccionar rutina...</option>
              {routines.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </FormSelect>
          )}

          {form.type === 'wod' && (
            <FormSelect label="WOD" value={form.wod_id} onChange={v => setForm(p => ({ ...p, wod_id: v }))} required>
              <option value="">Seleccionar WOD...</option>
              {wods.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </FormSelect>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Fecha" type="date" value={form.scheduled_date} onChange={v => setForm(p => ({ ...p, scheduled_date: v }))} required />
            <FormField label="Hora (opcional)" type="time" value={form.scheduled_time} onChange={v => setForm(p => ({ ...p, scheduled_time: v }))} />
          </div>

          <FormField label="Notas" value={form.notes} onChange={v => setForm(p => ({ ...p, notes: v }))} />

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--color-text-2)', userSelect: 'none' }}>
            <input type="checkbox" checked={form.repeat} onChange={e => setForm(p => ({ ...p, repeat: e.target.checked }))} />
            Repetir en días de la semana
          </label>

          {form.repeat && (
            <div style={{ padding: 14, background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-3)', marginBottom: 8 }}>Días</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {WEEK_DAYS.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: form.repeatDays.includes(d.value) ? 'var(--color-red)' : 'var(--color-border)',
                        color: form.repeatDays.includes(d.value) ? '#fff' : 'var(--color-text-3)',
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <FormField label="Hasta" type="date" value={form.repeatUntil} onChange={v => setForm(p => ({ ...p, repeatUntil: v }))} />
            </div>
          )}

          {error && <p style={{ fontSize: 13, color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, cursor: 'pointer', background: 'transparent', color: 'var(--color-text)' }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: '10px', background: loading ? 'var(--color-border)' : 'var(--color-red)', color: loading ? 'var(--color-text-3)' : '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Asignando...' : 'Asignar entrenamiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({ label, value, onChange, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>
        {label}{required && <span style={{ color: 'var(--color-red)' }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }}
      />
    </div>
  )
}

function FormSelect({ label, value, onChange, required = false, children }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>
        {label}{required && <span style={{ color: 'var(--color-red)' }}> *</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)' }}
      >
        {children}
      </select>
    </div>
  )
}
