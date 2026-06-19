'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRoutine, addBlock, addExerciseToBlock,
  updateRoutineExercise, removeExerciseFromBlock,
  type RoutineExerciseFull, type RoutineBlockFull,
} from '@/lib/queries/routines'
import { getExercises } from '@/lib/queries/exercises'
import Link from 'next/link'

export function RoutineBuilder({ routineId }: { routineId: string }) {
  const qc = useQueryClient()
  const [showExPicker, setShowExPicker] = useState<string | null>(null) // blockId

  const { data: routine, isLoading } = useQuery({
    queryKey: ['routine', routineId],
    queryFn: () => getRoutine(routineId),
  })

  const addBlockMutation = useMutation({
    mutationFn: () => addBlock(routineId, (routine?.blocks.length ?? 0)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routine', routineId] }),
  })

  const removeExMutation = useMutation({
    mutationFn: removeExerciseFromBlock,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routine', routineId] }),
  })

  if (isLoading) return <div style={{ padding: 40, color: 'var(--color-text-3)' }}>Cargando rutina...</div>
  if (!routine) return <div style={{ padding: 40, color: 'var(--color-error)' }}>Rutina no encontrada</div>

  return (
    <div style={{ padding: '32px 40px', maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <Link href="/dashboard/rutinas" style={{ fontSize: 20, color: 'var(--color-text-3)', textDecoration: 'none' }}>←</Link>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            {routine.name}
          </h1>
          {routine.description && (
            <p style={{ fontSize: 14, color: 'var(--color-text-3)', marginTop: 3 }}>{routine.description}</p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {routine.blocks.map((block, blockIdx) => (
          <BlockCard
            key={block.id}
            block={block}
            blockNumber={blockIdx + 1}
            onAddExercise={() => setShowExPicker(block.id)}
            onRemoveExercise={(exId) => removeExMutation.mutate(exId)}
            onUpdateExercise={(exId, updates) => {
              updateRoutineExercise(exId, updates as Parameters<typeof updateRoutineExercise>[1]).then(() =>
                qc.invalidateQueries({ queryKey: ['routine', routineId] })
              )
            }}
          />
        ))}

        <button
          onClick={() => addBlockMutation.mutate()}
          disabled={addBlockMutation.isPending}
          style={{
            border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)',
            padding: '16px', background: 'transparent', cursor: 'pointer',
            color: 'var(--color-text-3)', fontSize: 14, fontWeight: 500,
            width: '100%',
          }}
        >
          + Agregar bloque
        </button>
      </div>

      {showExPicker && (
        <ExercisePicker
          onClose={() => setShowExPicker(null)}
          onSelect={async (exerciseId) => {
            const block = routine.blocks.find(b => b.id === showExPicker)
            const orderIndex = block?.exercises.length ?? 0
            await addExerciseToBlock(showExPicker, exerciseId, orderIndex, { sets: 3, reps: '10', rest_seconds: 60 })
            qc.invalidateQueries({ queryKey: ['routine', routineId] })
            setShowExPicker(null)
          }}
        />
      )}
    </div>
  )
}

function BlockCard({ block, blockNumber, onAddExercise, onRemoveExercise, onUpdateExercise }: {
  block: RoutineBlockFull
  blockNumber: number
  onAddExercise: () => void
  onRemoveExercise: (id: string) => void
  onUpdateExercise: (id: string, updates: Partial<RoutineExerciseFull>) => void
}) {
  const blockTypeLabels: Record<string, string> = {
    standard: 'Estándar', superset: 'Superserie', circuit: 'Circuito',
  }

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Bloque {blockNumber}
        </span>
        <span style={{ fontSize: 11, color: 'var(--color-text-4)', background: 'var(--color-border)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
          {blockTypeLabels[block.type] ?? block.type}
        </span>
      </div>

      <div>
        {block.exercises.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text-3)', fontSize: 14 }}>
            Sin ejercicios. Agrega el primero.
          </div>
        ) : (
          <div>
            {block.exercises.map((ex, i) => (
              <ExerciseRow
                key={ex.id}
                exercise={ex}
                isLast={i === block.exercises.length - 1}
                onRemove={() => onRemoveExercise(ex.id)}
                onUpdate={(updates) => onUpdateExercise(ex.id, updates)}
              />
            ))}
          </div>
        )}

        <div style={{ padding: '10px 16px', borderTop: block.exercises.length > 0 ? '1px solid var(--color-border)' : 'none' }}>
          <button
            onClick={onAddExercise}
            style={{ fontSize: 13, color: 'var(--color-red)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}
          >
            + Agregar ejercicio
          </button>
        </div>
      </div>
    </div>
  )
}

function ExerciseRow({ exercise, isLast, onRemove, onUpdate }: {
  exercise: RoutineExerciseFull
  isLast: boolean
  onRemove: () => void
  onUpdate: (updates: Partial<RoutineExerciseFull>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState({
    sets: exercise.sets ?? 3,
    reps: exercise.reps ?? '10',
    weight_kg: exercise.weight_kg ?? '',
    rest_seconds: exercise.rest_seconds ?? 60,
    rpe: exercise.rpe ?? '',
    notes: exercise.notes ?? '',
  })

  function save() {
    onUpdate({
      sets: Number(local.sets) || undefined,
      reps: local.reps || undefined,
      weight_kg: local.weight_kg ? Number(local.weight_kg) : undefined,
      rest_seconds: Number(local.rest_seconds) || undefined,
      rpe: local.rpe ? Number(local.rpe) : undefined,
      notes: local.notes || undefined,
    })
    setEditing(false)
  }

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-2)', flexShrink: 0, overflow: 'hidden' }}>
          {exercise.exercise?.gif_url ? (
            <img src={exercise.exercise.gif_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💪</div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 3 }}>
            {exercise.exercise?.name ?? 'Ejercicio'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
            {exercise.sets} series × {exercise.reps} reps
            {exercise.weight_kg ? ` · ${exercise.weight_kg} kg` : ''}
            {exercise.rest_seconds ? ` · ${exercise.rest_seconds}s descanso` : ''}
            {exercise.rpe ? ` · RPE ${exercise.rpe}` : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setEditing(!editing)}
            style={{ fontSize: 12, padding: '5px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: editing ? 'var(--color-surface-2)' : 'transparent', color: 'var(--color-text-2)' }}
          >
            {editing ? 'Cerrar' : 'Editar'}
          </button>
          <button onClick={onRemove} style={{ fontSize: 12, padding: '5px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-3)' }}>✕</button>
        </div>
      </div>

      {editing && (
        <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) 1fr', gap: 10 }}>
          <NumField label="Series" value={local.sets} onChange={v => setLocal(p => ({ ...p, sets: v }))} />
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-3)', marginBottom: 4 }}>Reps</label>
            <input value={local.reps} onChange={e => setLocal(p => ({ ...p, reps: e.target.value }))} placeholder="10 / 8-12 / MAX" style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <NumField label="Peso (kg)" value={local.weight_kg} onChange={v => setLocal(p => ({ ...p, weight_kg: v }))} placeholder="0" />
          <NumField label="Descanso (s)" value={local.rest_seconds} onChange={v => setLocal(p => ({ ...p, rest_seconds: v }))} />
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-3)', marginBottom: 4 }}>Notas</label>
              <input value={local.notes} onChange={e => setLocal(p => ({ ...p, notes: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <button onClick={save} style={{ marginTop: 16, padding: '7px 16px', background: 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NumField({ label, value, onChange, placeholder }: { label: string; value: any; onChange: (v: any) => void; placeholder?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-3)', marginBottom: 4 }}>{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }}
      />
    </div>
  )
}

function ExercisePicker({ onClose, onSelect }: { onClose: () => void; onSelect: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState('')

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises-picker', muscle],
    queryFn: () => getExercises({ muscle_group: muscle || undefined }),
  })

  const filtered = exercises.filter(e =>
    search === '' || e.name.toLowerCase().includes(search.toLowerCase())
  )

  const MUSCLES: Record<string, string> = {
    chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros', biceps: 'Bíceps',
    triceps: 'Tríceps', legs: 'Piernas', glutes: 'Glúteos', abs: 'Abdomen',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 560, height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>Seleccionar ejercicio</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-3)' }}>✕</button>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', gap: 10, flexDirection: 'column' }}>
          <input
            autoFocus
            placeholder="Buscar ejercicio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setMuscle('')} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 'var(--radius-full)', border: 'none', background: muscle === '' ? 'var(--color-red)' : 'var(--color-surface-2)', color: muscle === '' ? '#fff' : 'var(--color-text-3)', cursor: 'pointer' }}>
              Todos
            </button>
            {Object.entries(MUSCLES).map(([k, v]) => (
              <button key={k} onClick={() => setMuscle(k)} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 'var(--radius-full)', border: 'none', background: muscle === k ? 'var(--color-red)' : 'var(--color-surface-2)', color: muscle === k ? '#fff' : 'var(--color-text-3)', cursor: 'pointer' }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {isLoading ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-3)' }}>Cargando ejercicios...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-3)' }}>Sin resultados</div>
          ) : (
            filtered.map(ex => (
              <button
                key={ex.id}
                onClick={() => onSelect(ex.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '10px 20px', background: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-2)', overflow: 'hidden', flexShrink: 0 }}>
                  {ex.gif_url
                    ? <img src={ex.gif_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💪</div>
                  }
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>{ex.name}</p>
                  {ex.muscle_group && (
                    <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{ex.muscle_group}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
