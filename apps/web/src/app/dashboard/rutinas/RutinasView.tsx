'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRoutines, createRoutine, deleteRoutine } from '@/lib/queries/routines'
import Link from 'next/link'

const ROUTINE_TYPES = [
  { value: 'strength', label: 'Fuerza' },
  { value: 'hypertrophy', label: 'Hipertrofia' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'rehab', label: 'Rehabilitación' },
  { value: 'general', label: 'General' },
]

export function RutinasView() {
  const [showModal, setShowModal] = useState(false)
  const qc = useQueryClient()

  const { data: routines = [], isLoading } = useQuery({
    queryKey: ['routines'],
    queryFn: getRoutines,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRoutine,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  })

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            Rutinas
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-3)', marginTop: 4 }}>
            {routines.length} {routines.length === 1 ? 'rutina' : 'rutinas'}
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
          + Nueva rutina
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 140, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : routines.length === 0 ? (
        <EmptyRoutines onAdd={() => setShowModal(true)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {routines.map((r: any) => (
            <RoutineCard key={r.id} routine={r} onDelete={() => {
              if (confirm('¿Eliminar esta rutina?')) deleteMutation.mutate(r.id)
            }} />
          ))}
        </div>
      )}

      {showModal && (
        <NewRoutineModal
          onClose={() => setShowModal(false)}
          onSuccess={(id) => {
            setShowModal(false)
            qc.invalidateQueries({ queryKey: ['routines'] })
            window.location.href = `/dashboard/rutinas/${id}`
          }}
        />
      )}
    </div>
  )
}

function RoutineCard({ routine, onDelete }: { routine: any; onDelete: () => void }) {
  const typeLabel = ROUTINE_TYPES.find(t => t.value === routine.type)?.label ?? routine.type ?? 'General'

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      transition: 'box-shadow 0.15s', position: 'relative',
    }}>
      <div style={{
        padding: '4px 10px',
        background: routine.is_template ? 'var(--color-red-muted)' : 'var(--color-surface-2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {typeLabel}
        </span>
        {routine.is_template && (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-red)' }}>Plantilla</span>
        )}
      </div>

      <div style={{ padding: '14px 16px 12px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>
          {routine.name}
        </h3>
        {routine.description && (
          <p style={{ fontSize: 13, color: 'var(--color-text-3)', lineHeight: 1.4, marginBottom: 12, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
            {routine.description}
          </p>
        )}
        {routine.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            {routine.tags.map((tag: string) => (
              <span key={tag} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-surface-2)', color: 'var(--color-text-3)' }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href={`/dashboard/rutinas/${routine.id}`}
            style={{
              flex: 1, textAlign: 'center', padding: '7px',
              background: 'var(--color-surface-2)', color: 'var(--color-text-2)',
              borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Editar
          </Link>
          <button
            onClick={onDelete}
            style={{
              padding: '7px 12px', background: 'transparent',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              fontSize: 13, color: 'var(--color-text-3)', cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyRoutines({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '56px 24px', textAlign: 'center' }}>
      <p style={{ fontSize: 32, marginBottom: 12 }}>📋</p>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>Sin rutinas todavía</h3>
      <p style={{ fontSize: 14, color: 'var(--color-text-3)', marginBottom: 20 }}>
        Crea planes de entrenamiento con bloques, series y ejercicios personalizados.
      </p>
      <button onClick={onAdd} style={{ background: 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        Crear primera rutina
      </button>
    </div>
  )
}

function NewRoutineModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (id: string) => void }) {
  const [form, setForm] = useState({ name: '', description: '', type: 'general', is_template: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const routine = await createRoutine({
        name: form.name,
        description: form.description || undefined,
        type: form.type,
        is_template: form.is_template,
      })
      onSuccess(routine.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear rutina')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>Nueva rutina</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-3)' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>
              Nombre <span style={{ color: 'var(--color-red)' }}>*</span>
            </label>
            <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>Descripción</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>Tipo</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)' }}>
              {ROUTINE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--color-text-2)' }}>
            <input type="checkbox" checked={form.is_template} onChange={e => setForm(p => ({ ...p, is_template: e.target.checked }))} />
            Guardar como plantilla
          </label>
          {error && <p style={{ fontSize: 13, color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, cursor: 'pointer', background: 'transparent', color: 'var(--color-text)' }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', background: loading ? 'var(--color-border)' : 'var(--color-red)', color: loading ? 'var(--color-text-3)' : '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Creando...' : 'Crear y editar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
