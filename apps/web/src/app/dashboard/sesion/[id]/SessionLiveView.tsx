'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getRoutine, type RoutineExerciseFull } from '@/lib/queries/routines'
import {
  getSessionLogs,
  createSessionLog,
  addSetLog,
  updateSetLog,
  deleteSetLog,
  type SessionLog,
  type SetLog,
} from '@/lib/queries/session-logs'
import { updateSessionStatus, type TrainingSession } from '@/lib/queries/sessions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Play, CheckCircle2, Plus, Minus, Trash2,
  ChevronDown, ChevronUp, Timer, Dumbbell, Trophy, SkipForward,
} from 'lucide-react'

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ExerciseState {
  rxId: string        // routine_exercise id
  exerciseId: string
  name: string
  prescribed: { sets: number | null; reps: string | null; weight_kg: number | null; rest_seconds: number | null }
  logId: string | null
  sets: SetLog[]
  collapsed: boolean
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function fmtTime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function NumStepper({
  value, onChange, min = 0, step = 1, suffix = '',
}: {
  value: string; onChange: (v: string) => void; min?: number; step?: number; suffix?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <button
        type="button"
        onClick={() => onChange(String(Math.max(min, (parseFloat(value) || 0) - step)))}
        style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)' }}
      >
        <Minus size={12} />
      </button>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: suffix === 'kg' ? 64 : 52, height: 32, textAlign: 'center',
            border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 14,
            fontWeight: 600, color: 'var(--color-text)', background: 'var(--color-surface)',
            outline: 'none', padding: '0 4px',
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => onChange(String((parseFloat(value) || 0) + step))}
        style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)' }}
      >
        <Plus size={12} />
      </button>
      {suffix && <span style={{ fontSize: 12, color: 'var(--color-text-3)', marginLeft: 2, minWidth: 16 }}>{suffix}</span>}
    </div>
  )
}

// â”€â”€â”€ Set row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SetRow({
  set, setNum, onUpdate, onDelete,
}: {
  set: SetLog; setNum: number; onUpdate: (id: string, u: Partial<SetLog>) => void; onDelete: (id: string) => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0',
      borderBottom: '1px solid var(--color-border)',
    }}>
      <span style={{
        width: 24, height: 24, borderRadius: 6, background: 'var(--color-red)',
        color: '#fff', fontSize: 11, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {setNum}
      </span>

      <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <NumStepper
          value={String(set.reps_completed ?? '')}
          onChange={v => onUpdate(set.id, { reps_completed: v === '' ? null : parseInt(v) })}
          min={1}
          suffix="reps"
        />
        <NumStepper
          value={String(set.weight_kg ?? '')}
          onChange={v => onUpdate(set.id, { weight_kg: v === '' ? null : parseFloat(v) })}
          min={0}
          step={2.5}
          suffix="kg"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {set.is_pr && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#F97316', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 20, padding: '2px 7px' }}>
            PR
          </span>
        )}
        <button
          onClick={() => onDelete(set.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)', padding: 4, display: 'flex', alignItems: 'center' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// â”€â”€â”€ Exercise Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ExerciseCard({
  ex, onAddSet, onUpdateSet, onDeleteSet, saving,
}: {
  ex: ExerciseState
  onAddSet: (rxId: string) => void
  onUpdateSet: (rxId: string, setId: string, updates: Partial<SetLog>) => void
  onDeleteSet: (rxId: string, setId: string) => void
  saving: boolean
}) {
  const done = ex.prescribed.sets ? ex.sets.length >= ex.prescribed.sets : ex.sets.length > 0
  const prescribedText = [
    ex.prescribed.sets ? `${ex.prescribed.sets} series` : null,
    ex.prescribed.reps ? `${ex.prescribed.reps} reps` : null,
    ex.prescribed.weight_kg ? `${ex.prescribed.weight_kg} kg` : null,
  ].filter(Boolean).join(' Í— ')

  return (
    <div style={{
      background: 'var(--color-surface)', border: `1px solid ${done ? 'rgba(22,163,74,0.3)' : 'var(--color-border)'}`,
      borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)',
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        background: done ? 'rgba(22,163,74,0.04)' : 'transparent',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: done ? 'rgba(22,163,74,0.1)' : 'var(--color-bg)',
          border: `1px solid ${done ? 'rgba(22,163,74,0.2)' : 'var(--color-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {done
            ? <CheckCircle2 size={18} color="#16A34A" />
            : <Dumbbell size={16} color="var(--color-text-3)" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
            {ex.name}
          </p>
          {prescribedText && (
            <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2 }}>
              Prescrito: {prescribedText}
            </p>
          )}
        </div>
        <span style={{
          fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, flexShrink: 0,
          background: done ? 'rgba(22,163,74,0.1)' : 'var(--color-bg)',
          color: done ? '#16A34A' : 'var(--color-text-3)',
          border: `1px solid ${done ? 'rgba(22,163,74,0.2)' : 'var(--color-border)'}`,
        }}>
          {ex.sets.length}{ex.prescribed.sets ? `/${ex.prescribed.sets}` : ''} sets
        </span>
      </div>

      {/* Sets */}
      <div style={{ padding: '0 16px' }}>
        {ex.sets.map((s, i) => (
          <SetRow
            key={s.id}
            set={s}
            setNum={i + 1}
            onUpdate={(id, u) => onUpdateSet(ex.rxId, id, u)}
            onDelete={(id) => onDeleteSet(ex.rxId, id)}
          />
        ))}
      </div>

      {/* Add set */}
      <div style={{ padding: '10px 16px' }}>
        <button
          onClick={() => onAddSet(ex.rxId)}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, width: '100%',
            padding: '9px 14px', border: '1.5px dashed var(--color-border)',
            borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer',
            background: 'transparent', color: 'var(--color-red)',
            fontSize: 13, fontWeight: 600, justifyContent: 'center',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.06)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <Plus size={14} />
          {ex.sets.length === 0 ? 'Registrar primera serie' : 'Agregar serie'}
        </button>
      </div>
    </div>
  )
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function SessionLiveView({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const qc = useQueryClient()

  // â”€â”€ Load session â”€â”€
  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*, routine:routines(id, name), wod:wods(id, name), athlete:athletes(id, first_name, last_name)')
        .eq('id', sessionId)
        .single()
      if (error) throw error
      return data as TrainingSession & {
        routine: { id: string; name: string } | null
        wod: { id: string; name: string } | null
        athlete: { id: string; first_name: string; last_name: string } | null
      }
    },
  })

  // â”€â”€ Load routine if applicable â”€â”€
  const { data: routine, isLoading: loadingRoutine } = useQuery({
    queryKey: ['routine', session?.routine_id],
    queryFn: () => getRoutine(session!.routine_id!),
    enabled: !!session?.routine_id,
  })

  // â”€â”€ Load existing logs â”€â”€
  const { data: existingLogs = [] } = useQuery({
    queryKey: ['session-logs', sessionId],
    queryFn: () => getSessionLogs(sessionId),
    enabled: !!session,
  })

  // â”€â”€ Elapsed timer â”€â”€
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (session?.status === 'started') {
      startRef.current = Date.now() - elapsed * 1000
      const iv = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current!) / 1000))
      }, 1000)
      return () => clearInterval(iv)
    }
  }, [session?.status])

  // â”€â”€ Exercise states (local) â”€â”€
  const [exercises, setExercises] = useState<ExerciseState[]>([])
  const [savingSet, setSavingSet] = useState(false)
  const [completing, setCompleting] = useState(false)

  // Build exercise states from routine blocks
  useEffect(() => {
    if (!routine) return
    const allExercises = routine.blocks.flatMap(b => b.exercises)
    setExercises(allExercises.map(rx => {
      const existingLog = existingLogs.find(l => l.routine_exercise_id === rx.id)
      return {
        rxId: rx.id,
        exerciseId: rx.exercise.id,
        name: rx.exercise.name,
        prescribed: {
          sets: rx.sets,
          reps: rx.reps,
          weight_kg: rx.weight_kg,
          rest_seconds: rx.rest_seconds,
        },
        logId: existingLog?.id ?? null,
        sets: existingLog?.sets ?? [],
        collapsed: false,
      }
    }))
  }, [routine, existingLogs])

  // â”€â”€ Start session â”€â”€
  const startMutation = useMutation({
    mutationFn: () => updateSessionStatus(sessionId, 'started'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session', sessionId] })
      startRef.current = Date.now()
    },
  })

  // â”€â”€ Skip session â”€â”€
  const skipMutation = useMutation({
    mutationFn: () => updateSessionStatus(sessionId, 'skipped'),
    onSuccess: () => router.back(),
  })

  // â”€â”€ Add set â”€â”€
  const handleAddSet = useCallback(async (rxId: string) => {
    setSavingSet(true)
    try {
      const ex = exercises.find(e => e.rxId === rxId)!
      let logId = ex.logId

      // Create session_log if needed
      if (!logId) {
        const log = await createSessionLog({
          session_id: sessionId,
          exercise_id: ex.exerciseId,
          routine_exercise_id: rxId,
          exercise_name: ex.name,
          athlete_id: session?.athlete_id ?? null,
        })
        logId = log.id
        setExercises(prev => prev.map(e => e.rxId === rxId ? { ...e, logId } : e))
      }

      // Determine starting values from last set
      const lastSet = ex.sets[ex.sets.length - 1]
      const newSet = await addSetLog({
        session_log_id: logId,
        set_number: ex.sets.length + 1,
        reps_completed: lastSet?.reps_completed ?? (ex.prescribed.reps ? parseInt(ex.prescribed.reps) || null : null),
        weight_kg: lastSet?.weight_kg ?? ex.prescribed.weight_kg ?? null,
        exercise_name: ex.name,
      })

      setExercises(prev => prev.map(e => e.rxId === rxId ? { ...e, sets: [...e.sets, newSet] } : e))
    } finally {
      setSavingSet(false)
    }
  }, [exercises, sessionId, session?.athlete_id])

  // â”€â”€ Update set â”€â”€
  const handleUpdateSet = useCallback(async (rxId: string, setId: string, updates: Partial<SetLog>) => {
    setExercises(prev => prev.map(e =>
      e.rxId === rxId
        ? { ...e, sets: e.sets.map(s => s.id === setId ? { ...s, ...updates } : s) }
        : e
    ))
    await updateSetLog(setId, updates)
  }, [])

  // â”€â”€ Delete set â”€â”€
  const handleDeleteSet = useCallback(async (rxId: string, setId: string) => {
    setExercises(prev => prev.map(e =>
      e.rxId === rxId
        ? { ...e, sets: e.sets.filter(s => s.id !== setId).map((s, i) => ({ ...s, set_number: i + 1 })) }
        : e
    ))
    await deleteSetLog(setId)
  }, [])

  // â”€â”€ Complete session â”€â”€
  const handleComplete = async () => {
    setCompleting(true)
    try {
      await updateSessionStatus(sessionId, 'completed')
      qc.invalidateQueries({ queryKey: ['session', sessionId] })
      qc.invalidateQueries({ queryKey: ['athlete-sessions'] })
      router.back()
    } finally {
      setCompleting(false)
    }
  }

  // â”€â”€ Loading â”€â”€
  const loading = loadingSession || (!!session?.routine_id && loadingRoutine)
  if (loading) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-3)', fontSize: 14 }}>
      Cargando sesión...
    </div>
  )
  if (!session) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-red)', fontSize: 14 }}>
      Sesión no encontrada
    </div>
  )

  const sessionName = session.routine?.name ?? session.wod?.name
    ?? (session.type === 'rest' ? 'Descanso' : 'Evento')
  const athleteName = (session as any).athlete
    ? `${(session as any).athlete.first_name} ${(session as any).athlete.last_name}`
    : null

  const totalSets   = exercises.reduce((sum, e) => sum + e.sets.length, 0)
  const doneSets    = exercises.filter(e => e.prescribed.sets ? e.sets.length >= e.prescribed.sets : e.sets.length > 0).length
  const progress    = exercises.length > 0 ? Math.round((doneSets / exercises.length) * 100) : 0
  const isStarted   = session.status === 'started'
  const isCompleted = session.status === 'completed'

  return (
    <div className="eb-page" style={{ maxWidth: 760 }}>
      {/* â”€â”€ Back â”€â”€ */}
      <button
        onClick={() => router.back()}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: 'var(--color-text-3)', background: 'none',
          border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0, fontWeight: 500,
        }}
      >
        <ArrowLeft size={15} /> Volver
      </button>

      {/* â”€â”€ Header â”€â”€ */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 16, padding: '20px 24px', marginBottom: 20,
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              {new Date(session.scheduled_date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
              {athleteName && ` Â· ${athleteName}`}
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
              {sessionName}
            </h1>
          </div>

          {/* Timer / Status */}
          {isStarted && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'var(--color-bg)', border: '1px solid var(--color-border)',
              borderRadius: 12, padding: '10px 16px', flexShrink: 0,
            }}>
              <Timer size={14} color="var(--color-text-3)" />
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em', marginTop: 4 }}>
                {fmtTime(elapsed)}
              </p>
            </div>
          )}
          {isCompleted && (
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20,
              background: 'rgba(22,163,74,0.1)', color: '#16A34A',
              border: '1px solid rgba(22,163,74,0.2)', flexShrink: 0,
            }}>
              Completada
            </span>
          )}
        </div>

        {/* Progress bar */}
        {isStarted && exercises.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                {doneSets} de {exercises.length} ejercicios completados Â· {totalSets} series registradas
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: progress === 100 ? '#16A34A' : 'var(--color-red)' }}>
                {progress}%
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--color-bg)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: progress === 100 ? '#16A34A' : 'var(--color-red)',
                borderRadius: 99, transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* â”€â”€ Not started yet â”€â”€ */}
      {session.status === 'scheduled' && (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 16, padding: '40px 24px', textAlign: 'center',
          boxShadow: 'var(--shadow-card)', marginBottom: 16,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'var(--color-red)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
          }}>
            <Play size={24} color="#fff" fill="#fff" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
            Lista para comenzar
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-3)', marginBottom: 28, lineHeight: 1.5 }}>
            {exercises.length > 0
              ? `${exercises.length} ejercicios Â· ${exercises.reduce((s, e) => s + (e.prescribed.sets ?? 0), 0)} series totales`
              : 'Sesión de ' + (session.type === 'wod' ? 'WOD' : session.type)
            }
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', background: 'var(--color-red)', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                cursor: startMutation.isPending ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              }}
            >
              <Play size={16} fill="#fff" />
              {startMutation.isPending ? 'Iniciando...' : 'Iniciar sesión'}
            </button>
            <button
              onClick={() => { if (confirm('¿Marcar esta sesión como saltada?')) skipMutation.mutate() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 20px', background: 'transparent', color: 'var(--color-text-3)',
                border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 14, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <SkipForward size={15} />
              Saltar
            </button>
          </div>
        </div>
      )}

      {/* â”€â”€ WOD in session: redirect to timer â”€â”€ */}
      {isStarted && session.type === 'wod' && session.wod_id && (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 16, padding: '28px 24px', textAlign: 'center',
          boxShadow: 'var(--shadow-card)', marginBottom: 16,
        }}>
          <Trophy size={32} color="#F97316" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
            WOD en progreso
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-3)', marginBottom: 20 }}>
            Usa el timer del WOD para registrar el resultado.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={`/dashboard/wods/${session.wod_id}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 22px', background: '#F97316', color: '#fff',
                borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none',
              }}
            >
              <Timer size={15} />
              Abrir WOD timer
            </Link>
            <button
              onClick={handleComplete}
              disabled={completing}
              style={{
                padding: '11px 22px', background: 'rgba(22,163,74,0.1)', color: '#16A34A',
                border: '1px solid rgba(22,163,74,0.2)', borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: completing ? 'not-allowed' : 'pointer',
              }}
            >
              {completing ? 'Completando...' : 'Marcar completada'}
            </button>
          </div>
        </div>
      )}

      {/* â”€â”€ Routine exercises â”€â”€ */}
      {isStarted && exercises.length > 0 && (
        <>
          {routine?.blocks.map(block => {
            const blockExercises = exercises.filter(e =>
              routine.blocks.find(b => b.id === block.id)?.exercises.some(rx => rx.id === e.rxId)
            )
            return (
              <div key={block.id} style={{ marginBottom: 20 }}>
                {(block.name || block.type !== 'standard') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: 'var(--color-text-3)',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                      {block.name ?? (block.type === 'superset' ? 'Superserie' : block.type === 'circuit' ? 'Circuito' : 'Bloque')}
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {blockExercises.map(ex => (
                    <ExerciseCard
                      key={ex.rxId}
                      ex={ex}
                      onAddSet={handleAddSet}
                      onUpdateSet={handleUpdateSet}
                      onDeleteSet={handleDeleteSet}
                      saving={savingSet}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {/* Complete button */}
          <div style={{
            position: 'sticky', bottom: 16, marginTop: 8,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 14, padding: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          }}>
            <button
              onClick={handleComplete}
              disabled={completing}
              style={{
                width: '100%', padding: '14px 20px',
                background: progress === 100 ? '#16A34A' : 'var(--color-red)',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: completing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: `0 4px 14px ${progress === 100 ? 'rgba(22,163,74,0.35)' : 'rgba(99,102,241,0.35)'}`,
                transition: 'background 0.2s, box-shadow 0.2s',
              }}
            >
              <CheckCircle2 size={18} />
              {completing ? 'Completando...' : progress === 100 ? 'Â¡Completar sesión!' : `Completar sesión (${progress}%)`}
            </button>
          </div>
        </>
      )}

      {/* â”€â”€ Completed summary â”€â”€ */}
      {isCompleted && (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid rgba(22,163,74,0.25)',
          borderRadius: 16, padding: '32px 24px', textAlign: 'center',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'rgba(22,163,74,0.1)',
            border: '1px solid rgba(22,163,74,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <CheckCircle2 size={28} color="#16A34A" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
            Sesión completada
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-3)', marginBottom: 24 }}>
            {totalSets > 0 ? `${totalSets} series registradas` : 'Sin series registradas'}
          </p>
          <button
            onClick={() => router.back()}
            style={{
              padding: '11px 24px', background: 'var(--color-red)', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Volver
          </button>
        </div>
      )}
    </div>
  )
}
