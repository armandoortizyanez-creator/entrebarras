'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRoutine, addBlock, deleteBlock, updateBlock,
  addExerciseToBlock, updateRoutineExercise, removeExerciseFromBlock,
  assignRoutineToAthletes, getRoutineAssignments,
  type RoutineExerciseFull, type RoutineBlockFull,
} from '@/lib/queries/routines'
import { getExercises } from '@/lib/queries/exercises'
import { getAthletes } from '@/lib/queries/athletes'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Users, X, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react'

const BLOCK_TYPES = [
  { value: 'standard', label: 'Estándar' },
  { value: 'superset', label: 'Superserie' },
  { value: 'circuit', label: 'Circuito' },
  { value: 'amrap', label: 'AMRAP' },
  { value: 'emom', label: 'EMOM' },
]

const BLOCK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  standard:  { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' },
  superset:  { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  circuit:   { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  amrap:     { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  emom:      { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
}

const MUSCLE_GROUPS = [
  { value: 'cuádriceps', label: 'Cuádriceps' },
  { value: 'hombros', label: 'Hombros' },
  { value: 'pecho', label: 'Pecho' },
  { value: 'dorsal', label: 'Espalda' },
  { value: 'abdominales', label: 'Core/Abs' },
  { value: 'isquiotibiales', label: 'Isquios' },
  { value: 'bíceps', label: 'Bíceps' },
  { value: 'tríceps', label: 'Tríceps' },
  { value: 'glúteos', label: 'Glúteos' },
  { value: 'full body', label: 'Full body' },
]

const SOURCES = [
  { value: '', label: 'Todos' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'strength', label: 'Fuerza' },
  { value: 'hyrox', label: 'Hyrox' },
  { value: 'gymnastics', label: 'Calistenia' },
  { value: 'exercisedb', label: 'Biblioteca' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px',
  border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13.5,
  color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none',
}

export function RoutineBuilder({ routineId }: { routineId: string }) {
  const qc = useQueryClient()
  const [showExPicker, setShowExPicker] = useState<string | null>(null)
  const [showAssign, setShowAssign] = useState(false)

  const { data: routine, isLoading } = useQuery({
    queryKey: ['routine', routineId],
    queryFn: () => getRoutine(routineId),
  })

  const { data: assignments = [] as string[] } = useQuery({
    queryKey: ['routine-assignments', routineId],
    queryFn: () => getRoutineAssignments(routineId),
  })

  const addBlockMutation = useMutation({
    mutationFn: () => addBlock(routineId, (routine?.blocks.length ?? 0)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routine', routineId] }),
  })

  const deleteBlockMutation = useMutation({
    mutationFn: deleteBlock,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routine', routineId] }),
  })

  const removeExMutation = useMutation({
    mutationFn: removeExerciseFromBlock,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routine', routineId] }),
  })

  const handleUpdateExercise = useCallback(
    (exId: string, updates: Parameters<typeof updateRoutineExercise>[1]) =>
      updateRoutineExercise(exId, updates).then(() =>
        qc.invalidateQueries({ queryKey: ['routine', routineId] })
      ),
    [qc, routineId]
  )

  const handleUpdateBlock = useCallback(
    (blockId: string, data: Parameters<typeof updateBlock>[1]) =>
      updateBlock(blockId, data).then(() =>
        qc.invalidateQueries({ queryKey: ['routine', routineId] })
      ),
    [qc, routineId]
  )

  if (isLoading) return <SkeletonLoader />
  if (!routine) return <div style={{ padding: 48, color: '#EF4444', fontSize: 14 }}>Rutina no encontrada</div>

  const totalExercises = routine.blocks.reduce((sum, b) => sum + b.exercises.length, 0)

  return (
    <div style={{ padding: '36px 40px', maxWidth: 860 }}>
      {/* Back */}
      <Link href="/dashboard/rutinas" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none',
        fontWeight: 500, marginBottom: 24,
      }}>
        <ArrowLeft size={15} />
        Volver a Rutinas
      </Link>

      {/* Header card */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16,
        padding: '20px 24px', marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.04em', marginBottom: 4 }}>
            {routine.name}
          </h1>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            {routine.description && (
              <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{routine.description}</span>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <MetaChip label={`${routine.blocks.length} bloques`} />
              <MetaChip label={`${totalExercises} ejercicios`} />
              {(assignments as string[]).length > 0 && (
                <MetaChip label={`${(assignments as string[]).length} atletas`} icon={<Users size={11} />} />
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAssign(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', background: '#6366F1', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 13.5,
            fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Users size={14} />
          Asignar atletas
        </button>
      </div>

      {/* Blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {routine.blocks.map((block, blockIdx) => (
          <BlockCard
            key={block.id}
            block={block}
            blockNumber={blockIdx + 1}
            onAddExercise={() => setShowExPicker(block.id)}
            onRemoveExercise={(id) => removeExMutation.mutate(id)}
            onUpdateExercise={handleUpdateExercise}
            onUpdateBlock={(data) => handleUpdateBlock(block.id, data)}
            onDeleteBlock={() => {
              if (confirm(`¿Eliminar Bloque ${blockIdx + 1} y todos sus ejercicios?`)) {
                deleteBlockMutation.mutate(block.id)
              }
            }}
          />
        ))}

        <button
          onClick={() => addBlockMutation.mutate()}
          disabled={addBlockMutation.isPending}
          style={{
            border: '2px dashed var(--color-border)', borderRadius: 14,
            padding: '16px', background: 'transparent', cursor: 'pointer',
            color: 'var(--color-text-3)', fontSize: 13.5, fontWeight: 600, width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#6366F1' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-3)' }}
        >
          <Plus size={15} />
          {addBlockMutation.isPending ? 'Agregando...' : 'Agregar bloque'}
        </button>
      </div>

      {showExPicker && (
        <ExercisePicker
          onClose={() => setShowExPicker(null)}
          onSelect={async (exerciseId) => {
            const block = routine.blocks.find(b => b.id === showExPicker)
            const orderIndex = block?.exercises.length ?? 0
            await addExerciseToBlock(showExPicker, exerciseId, orderIndex, {
              sets: 3, reps: '10', rest_seconds: 60,
            })
            qc.invalidateQueries({ queryKey: ['routine', routineId] })
            setShowExPicker(null)
          }}
        />
      )}

      {showAssign && (
        <AssignModal
          routineId={routineId}
          currentAssignments={assignments}
          onClose={() => setShowAssign(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['routine-assignments', routineId] })
            setShowAssign(false)
          }}
        />
      )}
    </div>
  )
}

function MetaChip({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 12, fontWeight: 500, color: 'var(--color-text-2)',
      background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
      padding: '3px 9px', borderRadius: 20,
    }}>
      {icon}
      {label}
    </span>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• BLOCK CARD â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function BlockCard({ block, blockNumber, onAddExercise, onRemoveExercise, onUpdateExercise, onUpdateBlock, onDeleteBlock }: {
  block: RoutineBlockFull
  blockNumber: number
  onAddExercise: () => void
  onRemoveExercise: (id: string) => void
  onUpdateExercise: (id: string, updates: Parameters<typeof updateRoutineExercise>[1]) => void
  onUpdateBlock: (data: { name?: string; type?: string; notes?: string }) => void
  onDeleteBlock: () => void
}) {
  const [editingHeader, setEditingHeader] = useState(false)
  const [headerForm, setHeaderForm] = useState({ name: block.name ?? '', type: block.type ?? 'standard' })

  function saveHeader() {
    onUpdateBlock({ name: headerForm.name || undefined, type: headerForm.type })
    setEditingHeader(false)
  }

  const blockType = block.type ?? 'standard'
  const typeLabel = BLOCK_TYPES.find(t => t.value === blockType)?.label ?? blockType
  const colors = BLOCK_COLORS[blockType] ?? BLOCK_COLORS.standard

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
    }}>
      {/* Block header */}
      <div style={{
        padding: '12px 18px', borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#FAFBFC',
      }}>
        {/* Block number circle */}
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'var(--color-text)', color: 'var(--color-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, flexShrink: 0,
        }}>
          {blockNumber}
        </div>

        {editingHeader ? (
          <div style={{ display: 'flex', flex: 1, gap: 8, alignItems: 'center' }}>
            <input
              autoFocus
              value={headerForm.name}
              onChange={e => setHeaderForm(p => ({ ...p, name: e.target.value }))}
              placeholder={`Bloque ${blockNumber}`}
              style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, color: 'var(--color-text)', outline: 'none' }}
            />
            <select
              value={headerForm.type}
              onChange={e => setHeaderForm(p => ({ ...p, type: e.target.value }))}
              style={{ padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12, color: 'var(--color-text)', background: 'var(--color-surface)' }}
            >
              {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button onClick={saveHeader} style={{ padding: '6px 14px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>OK</button>
            <button onClick={() => setEditingHeader(false)} style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12, color: 'var(--color-text-2)', cursor: 'pointer' }}>âœ•</button>
          </div>
        ) : (
          <>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text)', flex: 1 }}>
              {block.name || `Bloque ${blockNumber}`}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '3px 8px', borderRadius: 20,
              background: colors.bg, color: colors.text,
              border: `1px solid ${colors.border}`,
            }}>
              {typeLabel}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setEditingHeader(true)}
                style={{ fontSize: 12, padding: '4px 10px', border: '1px solid var(--color-border)', borderRadius: 7, cursor: 'pointer', background: 'transparent', color: 'var(--color-text-2)', fontWeight: 500 }}
              >
                Editar
              </button>
              <button
                onClick={onDeleteBlock}
                style={{ padding: '4px 7px', border: '1px solid #FEE2E2', borderRadius: 7, cursor: 'pointer', background: 'transparent', color: '#EF4444', display: 'flex', alignItems: 'center' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Exercises */}
      <div>
        {block.exercises.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <Dumbbell size={24} color="var(--color-text-4)" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13.5, color: 'var(--color-text-3)' }}>Sin ejercicios. Agrega el primero.</p>
          </div>
        ) : (
          block.exercises.map((ex, i) => (
            <ExerciseRow
              key={ex.id}
              exercise={ex}
              index={i + 1}
              isLast={i === block.exercises.length - 1}
              onRemove={() => onRemoveExercise(ex.id)}
              onUpdate={(updates) => onUpdateExercise(ex.id, updates)}
            />
          ))
        )}

        <div style={{
          padding: '12px 18px',
          borderTop: block.exercises.length > 0 ? '1px solid var(--color-border)' : 'none',
        }}>
          <button
            onClick={onAddExercise}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 13, color: '#6366F1', background: 'rgba(99,102,241,0.10)',
              border: '1px solid #FED7D7', borderRadius: 8,
              padding: '6px 12px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            <Plus size={13} />
            Agregar ejercicio
          </button>
        </div>
      </div>
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• EXERCISE ROW â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ExerciseRow({ exercise, index, isLast, onRemove, onUpdate }: {
  exercise: RoutineExerciseFull
  index: number
  isLast: boolean
  onRemove: () => void
  onUpdate: (updates: Parameters<typeof updateRoutineExercise>[1]) => void
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

  const specs = [
    exercise.sets && exercise.reps ? `${exercise.sets} Í— ${exercise.reps}` : null,
    exercise.weight_kg ? `${exercise.weight_kg} kg` : null,
    exercise.rest_seconds ? `${exercise.rest_seconds}s descanso` : null,
    exercise.rpe ? `RPE ${exercise.rpe}` : null,
  ].filter(Boolean)

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px' }}>
        {/* Index circle */}
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'var(--color-surface-2)', color: 'var(--color-text-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>
          {index}
        </div>

        {/* Exercise thumbnail */}
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: 'var(--color-surface-2)', flexShrink: 0, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--color-border)',
        }}>
          {exercise.exercise?.gif_url
            ? <img src={exercise.exercise.gif_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Dumbbell size={16} color="var(--color-text-4)" />
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {exercise.exercise?.name ?? 'Ejercicio'}
          </p>
          {specs.length > 0 && (
            <p style={{ fontSize: 12, color: 'var(--color-text-2)' }}>
              {specs.join(' Â· ')}
            </p>
          )}
          {exercise.notes && (
            <p style={{ fontSize: 11.5, color: 'var(--color-text-3)', marginTop: 1, fontStyle: 'italic' }}>{exercise.notes}</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setEditing(!editing)}
            style={{
              fontSize: 12, padding: '5px 10px',
              border: '1px solid var(--color-border)', borderRadius: 7, cursor: 'pointer',
              background: editing ? 'var(--color-surface-2)' : 'transparent',
              color: 'var(--color-text-2)', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            {editing ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {editing ? 'Cerrar' : 'Editar'}
          </button>
          <button
            onClick={onRemove}
            style={{
              padding: '5px 8px', border: '1px solid var(--color-border)',
              borderRadius: 7, cursor: 'pointer', background: 'transparent',
              color: 'var(--color-border)', display: 'flex', alignItems: 'center',
              transition: 'color 0.1s, border-color 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#FEE2E2' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-4)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {editing && (
        <div style={{ padding: '0 18px 14px 18px', background: 'var(--color-surface-2)', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 10, paddingTop: 12 }}>
            <NumField label="Series" value={local.sets} onChange={v => setLocal(p => ({ ...p, sets: v }))} />
            <div>
              <label style={labelStyle}>Reps</label>
              <input value={local.reps} onChange={e => setLocal(p => ({ ...p, reps: e.target.value }))} placeholder="10 / 8-12 / MAX" style={inputStyle} />
            </div>
            <NumField label="Peso (kg)" value={local.weight_kg} onChange={v => setLocal(p => ({ ...p, weight_kg: v }))} placeholder="—" />
            <NumField label="Descanso (s)" value={local.rest_seconds} onChange={v => setLocal(p => ({ ...p, rest_seconds: v }))} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Notas</label>
              <input value={local.notes} onChange={e => setLocal(p => ({ ...p, notes: e.target.value }))} placeholder="Instrucciones adicionales..." style={inputStyle} />
            </div>
            <button
              onClick={save}
              style={{ padding: '8px 18px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• EXERCISE PICKER â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function ExercisePicker({ onClose, onSelect }: { onClose: () => void; onSelect: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState('')
  const [source, setSource] = useState('')

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises-picker', search, muscle, source],
    queryFn: () => getExercises({
      search: search || undefined,
      muscle_group: muscle || undefined,
      source: (source as import('@entrebarras/types').ExerciseSource) || undefined,
    }),
    staleTime: 30_000,
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 18, width: '100%', maxWidth: 600, height: '82vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', border: '1px solid var(--color-border)' }}>

        {/* Modal header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Seleccionar ejercicio</h2>
          <button onClick={onClose} style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', color: 'var(--color-text-2)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <input
            autoFocus
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, marginBottom: 10 }}
          />
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
            {SOURCES.map(s => (
              <FilterChip key={s.value} label={s.label} active={source === s.value} onClick={() => setSource(s.value)} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            <FilterChip label="Todos" active={muscle === ''} onClick={() => setMuscle('')} />
            {MUSCLE_GROUPS.map(m => (
              <FilterChip key={m.value} label={m.label} active={muscle === m.value} onClick={() => setMuscle(m.value)} />
            ))}
          </div>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-3)', fontSize: 14 }}>Cargando ejercicios...</div>
          ) : exercises.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Dumbbell size={24} color="var(--color-text-4)" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, color: 'var(--color-text-3)' }}>Sin resultados</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '10px 22px 0', fontSize: 11, color: 'var(--color-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {exercises.length} resultado{exercises.length !== 1 ? 's' : ''}
              </div>
              {exercises.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => onSelect(ex.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    padding: '11px 22px', background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--color-border)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--color-surface-2)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
                    {ex.gif_url
                      ? <img src={ex.gif_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Dumbbell size={16} color="var(--color-text-4)" />
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {ex.muscle_group && <span style={{ fontSize: 12, color: 'var(--color-text-2)' }}>{ex.muscle_group}</span>}
                      {ex.source && ex.source !== 'exercisedb' && (
                        <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, background: 'var(--color-surface-2)', color: 'var(--color-text-2)', fontWeight: 500 }}>
                          {ex.source}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• ASSIGN MODAL â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function AssignModal({ routineId, currentAssignments, onClose, onSaved }: {
  routineId: string
  currentAssignments: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentAssignments))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: athletes = [], isLoading } = useQuery({
    queryKey: ['athletes'],
    queryFn: () => getAthletes({ status: 'active' }),
  })

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      if (selected.size > 0) {
        await assignRoutineToAthletes(routineId, Array.from(selected))
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 18, width: '100%', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', border: '1px solid var(--color-border)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Asignar a atletas</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-2)', marginTop: 2 }}>
              {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', color: 'var(--color-text-2)' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {isLoading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-3)', fontSize: 14 }}>Cargando atletas...</div>
          ) : athletes.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-3)', fontSize: 14 }}>No hay atletas activos</div>
          ) : (
            athletes.map(a => {
              const checked = selected.has(a.id)
              const initials = `${a.first_name[0]}${(a.last_name ?? '')[0] ?? ''}`.toUpperCase()
              return (
                <button
                  key={a.id}
                  onClick={() => toggle(a.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    padding: '11px 22px',
                    background: checked ? 'rgba(99,102,241,0.10)' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    borderBottom: '1px solid var(--color-border)', transition: 'background 0.1s',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 20, height: 20, borderRadius: 6,
                    border: `2px solid ${checked ? '#6366F1' : 'var(--color-text-4)'}`,
                    background: checked ? '#6366F1' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.12s',
                  }}>
                    {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 800, lineHeight: 1 }}>âœ“</span>}
                  </div>
                  {/* Athlete initials */}
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366F1 0%, #4F52D4 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                      {a.first_name} {a.last_name ?? ''}
                    </p>
                    {a.email && (
                      <p style={{ fontSize: 12, color: 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email}</p>
                    )}
                  </div>
                  {currentAssignments.includes(a.id) && (
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(99,102,241,0.10)', color: '#6366F1', fontWeight: 600, flexShrink: 0 }}>
                      Asignada
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        <div style={{ padding: '16px 22px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
          {error && <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 10 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 13.5, cursor: 'pointer', background: 'transparent', color: 'var(--color-text-2)', fontWeight: 500 }}>
              Cancelar
            </button>
            <button onClick={save} disabled={saving} style={{ flex: 1, padding: '10px', background: saving ? 'var(--color-surface-2)' : '#6366F1', color: saving ? 'var(--color-text-3)' : '#fff', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Guardando...' : `Asignar a ${selected.size} atleta${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• UTILS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
function NumField({ label, value, onChange, placeholder }: { label: string; value: any; onChange: (v: any) => void; placeholder?: string }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 12, padding: '4px 10px', borderRadius: 20,
        border: active ? 'none' : '1px solid var(--color-border)',
        cursor: 'pointer',
        background: active ? 'var(--color-text)' : 'transparent',
        color: active ? 'var(--color-surface)' : 'var(--color-text-2)',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.1s',
      }}
    >
      {label}
    </button>
  )
}

function SkeletonLoader() {
  return (
    <div style={{ padding: '36px 40px', maxWidth: 860 }}>
      <div style={{ height: 20, width: 120, background: 'var(--color-surface-2)', borderRadius: 6, marginBottom: 24 }} />
      <div style={{ height: 72, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, marginBottom: 20 }} />
      {[...Array(2)].map((_, i) => (
        <div key={i} style={{ height: 180, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, marginBottom: 14 }} />
      ))}
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 }
