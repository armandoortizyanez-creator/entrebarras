'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBoxScheduleRange, upsertBoxSchedule, deleteBoxSchedule } from '@/lib/queries/box-schedule'
import type { BoxScheduleEntry } from '@/lib/queries/box-schedule'
import { getWods } from '@/lib/queries/wods'
import { getRoutines } from '@/lib/queries/routines'
import { getGroups } from '@/lib/queries/team'
import { ChevronLeft, ChevronRight, Plus, X, Zap, Dumbbell, Users } from 'lucide-react'

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DAYS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const WOD_TYPE_COLORS: Record<string, string> = {
  amrap: '#1D4ED8', emom: '#6D28D9', for_time: '#C2410C',
  tabata: '#9D174D', chipper: '#15803D', intervals: '#B45309', custom: '#475569',
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function ProgramacionView() {
  const qc = useQueryClient()
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [selected, setSelected] = useState<{ date: string; dayLabel: string } | null>(null)
  const [form, setForm] = useState({ wod_id: '', routine_id: '', group_id: '', notes: '', type: 'wod' as 'wod' | 'routine' })

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const from = toDateStr(weekStart)
  const to = toDateStr(addDays(weekStart, 6))
  const todayStr = toDateStr(new Date())

  const { data: schedule = [] } = useQuery({
    queryKey: ['box-schedule', from, to],
    queryFn: () => getBoxScheduleRange(from, to),
  })
  const { data: wods = [] } = useQuery({ queryKey: ['wods'], queryFn: getWods })
  const { data: routines = [] } = useQuery({ queryKey: ['routines'], queryFn: getRoutines })
  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: getGroups })

  const saveMutation = useMutation({
    mutationFn: upsertBoxSchedule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['box-schedule'] })
      setSelected(null)
      setForm({ wod_id: '', routine_id: '', group_id: '', notes: '', type: 'wod' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBoxSchedule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['box-schedule'] }),
  })

  function prevWeek() { setWeekStart(d => addDays(d, -7)) }
  function nextWeek() { setWeekStart(d => addDays(d, 7)) }
  function goToday()  { setWeekStart(getWeekStart(new Date())) }

  function openDay(dateStr: string, label: string) {
    setSelected({ date: dateStr, dayLabel: label })
    setForm({ wod_id: '', routine_id: '', group_id: '', notes: '', type: 'wod' })
  }

  function handleSave() {
    if (!selected) return
    saveMutation.mutate({
      scheduled_date: selected.date,
      wod_id: form.type === 'wod' && form.wod_id ? form.wod_id : null,
      routine_id: form.type === 'routine' && form.routine_id ? form.routine_id : null,
      group_id: form.group_id || null,
      notes: form.notes || undefined,
    })
  }

  const monthYear = (() => {
    const start = weekDays[0]
    const end = weekDays[6]
    if (start.getMonth() === end.getMonth()) {
      return `${MONTHS_ES[start.getMonth()]} ${start.getFullYear()}`
    }
    return `${MONTHS_ES[start.getMonth()]} "“ ${MONTHS_ES[end.getMonth()]} ${end.getFullYear()}`
  })()

  return (
    <div style={{ padding: isMobile ? '16px 16px 80px' : '32px 40px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        gap: isMobile ? 12 : 0,
        marginBottom: isMobile ? 16 : 28,
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Programación del Box
          </h1>
          {!isMobile && <p style={{ fontSize: 13, color: 'var(--color-text-2)' }}>Asigna el WOD o rutina de cada día para tus grupos</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={goToday} style={{
            padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8,
            border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-2)', cursor: 'pointer',
          }}>
            Hoy
          </button>
          <button onClick={prevWeek} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-2)' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', minWidth: isMobile ? 'auto' : 140, textAlign: 'center' }}>{monthYear}</span>
          <button onClick={nextWeek} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-2)' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Week grid "” desktop: 7 columns; mobile: vertical list */}
      <div style={isMobile
        ? { display: 'flex', flexDirection: 'column', gap: 8 }
        : { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }
      }>
        {weekDays.map((day, i) => {
          const dateStr = toDateStr(day)
          const isToday = dateStr === todayStr
          const dayEntries = schedule.filter(e => e.scheduled_date === dateStr)

          return (
            <div key={dateStr} style={{
              background: 'var(--color-surface)',
              border: isToday ? '1.5px solid #6366F1' : '1px solid var(--color-border)',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: isToday ? '0 0 0 3px rgba(99,102,241,0.12)' : '0 1px 3px rgba(0,0,0,0.25)',
              minHeight: isMobile ? 'auto' : 160,
              display: 'flex', flexDirection: isMobile ? 'row' : 'column',
            }}>
              {/* Day header */}
              <div style={{
                padding: isMobile ? '12px 14px' : '10px 12px',
                borderRight: isMobile ? '1px solid var(--color-border)' : 'none',
                borderBottom: isMobile ? 'none' : '1px solid var(--color-border)',
                display: 'flex',
                alignItems: isMobile ? 'center' : 'center',
                justifyContent: isMobile ? 'flex-start' : 'space-between',
                gap: isMobile ? 10 : 0,
                background: isToday ? '#FFF5F5' : 'transparent',
                flexShrink: 0,
                minWidth: isMobile ? 72 : 'auto',
              }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: isToday ? '#6366F1' : 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {DAYS_ES[i]}
                  </p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: isToday ? '#6366F1' : 'var(--color-text)', letterSpacing: '-0.04em', lineHeight: 1.1, marginTop: 1 }}>
                    {day.getDate()}
                  </p>
                </div>
                {!isMobile && (
                  <button
                    onClick={() => openDay(dateStr, `${DAYS_FULL[i]} ${day.getDate()}`)}
                    style={{
                      width: 26, height: 26, borderRadius: 7,
                      background: isToday ? '#FED7D7' : 'var(--color-surface-2)',
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isToday ? '#6366F1' : 'var(--color-text-3)',
                    }}
                  >
                    <Plus size={13} />
                  </button>
                )}
              </div>

              {/* Entries */}
              <div style={{
                flex: 1, padding: isMobile ? '8px 10px' : '8px',
                display: 'flex', flexDirection: isMobile ? 'row' : 'column',
                flexWrap: isMobile ? 'wrap' : 'nowrap',
                gap: 5,
                alignItems: isMobile ? 'center' : 'stretch',
              }}>
                {dayEntries.map(entry => {
                  const isWod = !!entry.wod
                  const name = entry.wod?.name ?? entry.routine?.name ?? 'Sin nombre'
                  const type = entry.wod?.type
                  const accentColor = type ? (WOD_TYPE_COLORS[type] ?? '#475569') : '#6366F1'

                  return (
                    <div key={entry.id} style={{
                      background: `${accentColor}12`,
                      border: `1px solid ${accentColor}33`,
                      borderLeft: `3px solid ${accentColor}`,
                      borderRadius: 7, padding: '6px 8px',
                      position: 'relative',
                      flex: isMobile ? '1 1 auto' : 'none',
                    }}
                      onMouseEnter={e => (e.currentTarget.querySelector('.del-btn') as HTMLElement)?.style.setProperty('opacity', '1')}
                      onMouseLeave={e => (e.currentTarget.querySelector('.del-btn') as HTMLElement)?.style.setProperty('opacity', '0')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        {isWod ? <Zap size={10} color={accentColor} /> : <Dumbbell size={10} color={accentColor} />}
                        <p style={{ fontSize: 11, fontWeight: 700, color: accentColor, letterSpacing: '0.04em' }}>
                          {isWod ? 'WOD' : 'RUTINA'}
                        </p>
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3 }}>{name}</p>
                      {entry.group && (
                        <p style={{ fontSize: 10, color: 'var(--color-text-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Users size={9} />
                          {entry.group.name}
                        </p>
                      )}
                      {entry.notes && (
                        <p style={{ fontSize: 10, color: 'var(--color-text-3)', marginTop: 1 }}>{entry.notes}</p>
                      )}
                      <button
                        className="del-btn"
                        onClick={() => deleteMutation.mutate(entry.id)}
                        style={{
                          position: 'absolute', top: 4, right: 4,
                          background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 4,
                          cursor: 'pointer', padding: 2, opacity: 0, transition: 'opacity 0.15s',
                          display: 'flex', alignItems: 'center',
                        }}
                      >
                        <X size={10} color="var(--color-text-3)" />
                      </button>
                    </div>
                  )
                })}

                {dayEntries.length === 0 && (
                  <button
                    onClick={() => openDay(dateStr, `${DAYS_FULL[i]} ${day.getDate()}`)}
                    style={{
                      flex: 1, background: 'none', border: '1.5px dashed var(--color-border)',
                      borderRadius: 8, cursor: 'pointer', color: 'var(--color-text-4)',
                      fontSize: 11, fontWeight: 500,
                      padding: isMobile ? '10px 14px' : '12px 8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: isMobile ? 100 : 'auto',
                    }}
                  >
                    + Asignar
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Side panel / modal */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex',
          background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
        }} onClick={() => setSelected(null)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-surface)', borderRadius: isMobile ? '20px 20px 0 0' : 20,
              padding: isMobile ? '24px 20px 32px' : '28px 28px 24px',
              width: '100%', maxWidth: isMobile ? '100%' : 440,
              boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
              position: isMobile ? 'fixed' : 'relative',
              bottom: isMobile ? 0 : 'auto',
              left: isMobile ? 0 : 'auto',
              right: isMobile ? 0 : 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                  Programar entrenamiento
                </p>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                  {selected.dayLabel}
                </h3>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'var(--color-surface-2)', border: 'none', borderRadius: 9, padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={16} color="var(--color-text-2)" />
              </button>
            </div>

            {/* Type toggle */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {(['wod', 'routine'] as const).map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t, wod_id: '', routine_id: '' }))}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    border: 'none',
                    background: form.type === t ? 'var(--color-text)' : 'var(--color-surface-2)',
                    color: form.type === t ? 'var(--color-surface)' : 'var(--color-text-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                  {t === 'wod' ? <Zap size={13} /> : <Dumbbell size={13} />}
                  {t === 'wod' ? 'WOD' : 'Rutina'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {form.type === 'wod' ? (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>WOD *</label>
                  <select value={form.wod_id} onChange={e => setForm(f => ({ ...f, wod_id: e.target.value }))}
                    style={{ width: '100%', padding: '9px 11px', border: '1px solid var(--color-border)', borderRadius: 9, fontSize: 13, color: 'var(--color-text)', background: 'var(--color-surface)', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="">Selecciona un WOD...</option>
                    {wods.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Rutina *</label>
                  <select value={form.routine_id} onChange={e => setForm(f => ({ ...f, routine_id: e.target.value }))}
                    style={{ width: '100%', padding: '9px 11px', border: '1px solid var(--color-border)', borderRadius: 9, fontSize: 13, color: 'var(--color-text)', background: 'var(--color-surface)', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="">Selecciona una rutina...</option>
                    {routines.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Grupo (opcional)</label>
                <select value={form.group_id} onChange={e => setForm(f => ({ ...f, group_id: e.target.value }))}
                  style={{ width: '100%', padding: '9px 11px', border: '1px solid var(--color-border)', borderRadius: 9, fontSize: 13, color: 'var(--color-text)', background: 'var(--color-surface)', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="">Todos los grupos</option>
                  {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Notas</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej. Clase de las 7am, cargar 80%..."
                  style={{ width: '100%', padding: '9px 11px', border: '1px solid var(--color-border)', borderRadius: 9, fontSize: 13, color: 'var(--color-text)', background: 'var(--color-surface)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSelected(null)}
                style={{ flex: 1, padding: '10px', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 13, fontWeight: 500, background: 'var(--color-surface)', color: 'var(--color-text-2)', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                disabled={saveMutation.isPending || (form.type === 'wod' ? !form.wod_id : !form.routine_id)}
                onClick={handleSave}
                style={{
                  flex: 2, padding: '10px', border: 'none', borderRadius: 10,
                  fontSize: 13, fontWeight: 700, color: '#fff',
                  background: saveMutation.isPending ? 'var(--color-text-3)' : '#6366F1',
                  cursor: saveMutation.isPending ? 'not-allowed' : 'pointer',
                }}>
                {saveMutation.isPending ? 'Guardando...' : 'âœ“ Programar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
