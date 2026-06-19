'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getExercises, createExercise } from '@/lib/queries/exercises'
import type { Exercise } from '@entrebarras/types'

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes',
  'hamstrings', 'calves', 'abs', 'forearms', 'traps', 'cardio',
]

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', legs: 'Piernas',
  glutes: 'Glúteos', hamstrings: 'Isquios', calves: 'Pantorrillas',
  abs: 'Abdomen', forearms: 'Antebrazos', traps: 'Trapecios', cardio: 'Cardio',
}

const EQUIPMENT = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell',
  'resistance band', 'pull-up bar',
]

const EQUIP_LABELS: Record<string, string> = {
  barbell: 'Barra', dumbbell: 'Mancuernas', cable: 'Cable', machine: 'Máquina',
  bodyweight: 'Peso corporal', kettlebell: 'Kettlebell',
  'resistance band': 'Banda elástica', 'pull-up bar': 'Barra de dominadas',
}

export function EjerciciosView() {
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState('')
  const [equipment, setEquipment] = useState('')
  const [source, setSource] = useState<'all' | 'exercisedb' | 'custom'>('all')
  const [showModal, setShowModal] = useState(false)
  const qc = useQueryClient()

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ['exercises', muscle, equipment, source],
    queryFn: () => getExercises({
      muscle_group: muscle || undefined,
      equipment: equipment || undefined,
      source: source === 'all' ? undefined : source,
    }),
  })

  const filtered = exercises.filter(e =>
    search === '' || e.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            Ejercicios
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-3)', marginTop: 4 }}>
            {filtered.length} ejercicios
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'var(--color-red)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-md)', padding: '9px 18px',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          + Ejercicio personalizado
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Sidebar de filtros */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <FilterSection title="Fuente">
            {(['all', 'custom', 'exercisedb'] as const).map(s => (
              <FilterButton key={s} active={source === s} onClick={() => setSource(s)}>
                {s === 'all' ? 'Todos' : s === 'custom' ? 'Mis ejercicios' : 'Biblioteca global'}
              </FilterButton>
            ))}
          </FilterSection>

          <FilterSection title="Grupo muscular">
            <FilterButton active={muscle === ''} onClick={() => setMuscle('')}>Todos</FilterButton>
            {MUSCLE_GROUPS.map(m => (
              <FilterButton key={m} active={muscle === m} onClick={() => setMuscle(m)}>
                {MUSCLE_LABELS[m] ?? m}
              </FilterButton>
            ))}
          </FilterSection>

          <FilterSection title="Equipamiento">
            <FilterButton active={equipment === ''} onClick={() => setEquipment('')}>Todos</FilterButton>
            {EQUIPMENT.map(e => (
              <FilterButton key={e} active={equipment === e} onClick={() => setEquipment(e)}>
                {EQUIP_LABELS[e] ?? e}
              </FilterButton>
            ))}
          </FilterSection>
        </div>

        {/* Grid de ejercicios */}
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Buscar ejercicio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 14px', marginBottom: 16,
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', outline: 'none',
            }}
          />

          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {[...Array(12)].map((_, i) => (
                <div key={i} style={{
                  height: 120, background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyExercises onAdd={() => setShowModal(true)} hasSearch={search.length > 0} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {filtered.map(ex => <ExerciseCard key={ex.id} exercise={ex} />)}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <NewExerciseModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            qc.invalidateQueries({ queryKey: ['exercises'] })
          }}
        />
      )}
    </div>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
      }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {children}
      </div>
    </div>
  )
}

function FilterButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left', padding: '5px 8px', borderRadius: 'var(--radius-sm)',
        fontSize: 13, cursor: 'pointer', border: 'none',
        color: active ? 'var(--color-red)' : 'var(--color-text-2)',
        background: active ? 'var(--color-red-muted)' : 'transparent',
        fontWeight: active ? 500 : 400,
      }}
    >
      {children}
    </button>
  )
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)', overflow: 'hidden',
      transition: 'box-shadow 0.15s, border-color 0.15s', cursor: 'pointer',
    }}>
      {exercise.gif_url ? (
        <img
          src={exercise.gif_url}
          alt={exercise.name}
          loading="lazy"
          style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{
          height: 80, background: 'var(--color-surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>
          🏋️
        </div>
      )}
      <div style={{ padding: '10px 12px' }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', lineHeight: 1.3 }}>
          {exercise.name}
        </p>
        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          {exercise.muscle_group && (
            <Tag>{MUSCLE_LABELS[exercise.muscle_group] ?? exercise.muscle_group}</Tag>
          )}
          {exercise.source === 'custom' && (
            <Tag accent>Propio</Tag>
          )}
        </div>
      </div>
    </div>
  )
}

function Tag({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 500,
      color: accent ? 'var(--color-red)' : 'var(--color-text-3)',
      background: accent ? 'var(--color-red-muted)' : 'var(--color-surface-2)',
      padding: '2px 7px', borderRadius: 'var(--radius-full)',
    }}>
      {children}
    </span>
  )
}

function EmptyExercises({ onAdd, hasSearch }: { onAdd: () => void; hasSearch: boolean }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)', padding: '56px 24px', textAlign: 'center',
    }}>
      <p style={{ fontSize: 32, marginBottom: 12 }}>🏋️</p>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
        {hasSearch ? 'Sin resultados' : 'Sin ejercicios aún'}
      </h3>
      <p style={{ fontSize: 14, color: 'var(--color-text-3)', marginBottom: 20 }}>
        {hasSearch
          ? 'Prueba con otro término de búsqueda.'
          : 'La biblioteca global de ejercicios se carga una sola vez desde ExerciseDB.'}
      </p>
      {!hasSearch && (
        <button
          onClick={onAdd}
          style={{
            background: 'var(--color-red)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-md)', padding: '9px 20px',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Crear ejercicio personalizado
        </button>
      )}
    </div>
  )
}

function NewExerciseModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: '', description: '', muscle_group: '', equipment: '', category: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await createExercise({
        name: form.name,
        description: form.description || undefined,
        muscle_group: form.muscle_group || undefined,
        equipment: form.equipment || undefined,
        source: 'custom',
        is_public: false,
      })
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-xl)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid var(--color-border)',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>
            Nuevo ejercicio
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-3)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <MField label="Nombre" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} required />
          <MField label="Descripción" value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>
                Grupo muscular
              </label>
              <select
                value={form.muscle_group}
                onChange={e => setForm(p => ({ ...p, muscle_group: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)' }}
              >
                <option value="">Sin definir</option>
                {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{MUSCLE_LABELS[m]}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>
                Equipamiento
              </label>
              <select
                value={form.equipment}
                onChange={e => setForm(p => ({ ...p, equipment: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)' }}
              >
                <option value="">Sin definir</option>
                {EQUIPMENT.map(e => <option key={e} value={e}>{EQUIP_LABELS[e]}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, cursor: 'pointer', background: 'transparent', color: 'var(--color-text)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', background: loading ? 'var(--color-border)' : 'var(--color-red)', color: loading ? 'var(--color-text-3)' : '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MField({ label, value, onChange, required = false }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>
        {label}{required && <span style={{ color: 'var(--color-red)' }}> *</span>}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }}
      />
    </div>
  )
}
