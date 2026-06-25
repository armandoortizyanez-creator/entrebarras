'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRoutines, createRoutine, deleteRoutine } from '@/lib/queries/routines'
import Link from 'next/link'
import { Plus, X, ClipboardList, Layers } from 'lucide-react'

const ROUTINE_TYPES = [
  { value: 'strength', label: 'Fuerza' },
  { value: 'hypertrophy', label: 'Hipertrofia' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'rehab', label: 'Rehabilitación' },
  { value: 'general', label: 'General' },
]

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  strength:    { bg: 'rgba(251,146,60,0.10)',  text: '#FB923C', border: 'rgba(251,146,60,0.20)' },
  hypertrophy: { bg: 'rgba(99,102,241,0.10)',  text: '#818CF8', border: 'rgba(99,102,241,0.20)' },
  cardio:      { bg: 'rgba(52,211,153,0.10)',  text: '#34D399', border: 'rgba(52,211,153,0.20)' },
  crossfit:    { bg: 'rgba(244,114,182,0.10)', text: '#F472B6', border: 'rgba(244,114,182,0.20)' },
  rehab:       { bg: 'rgba(251,191,36,0.10)',  text: '#FBBF24', border: 'rgba(251,191,36,0.20)' },
  general:     { bg: 'rgba(138,147,168,0.10)', text: '#8A93A8', border: 'rgba(138,147,168,0.20)' },
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px',
  border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13.5,
  color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none',
}

export function RutinasView() {
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
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
    <div className="eb-page" style={{ maxWidth: 1100 }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.04em' }}>Rutinas</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginTop: 4 }}>
            {routines.length} {routines.length === 1 ? 'rutina registrada' : 'rutinas registradas'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: '#6366F1', color: '#fff', border: 'none',
            borderRadius: 10, padding: '9px 18px',
            fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
          }}
        >
          <Plus size={15} />
          Nueva rutina
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 150, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14 }} />
          ))}
        </div>
      ) : routines.length === 0 ? (
        <EmptyRoutines onAdd={() => setShowModal(true)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
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
            router.push(`/dashboard/rutinas/${id}`)
          }}
        />
      )}
    </div>
  )
}

function RoutineCard({ routine, onDelete }: { routine: any; onDelete: () => void }) {
  const typeKey = routine.type ?? 'general'
  const typeLabel = ROUTINE_TYPES.find(t => t.value === typeKey)?.label ?? typeKey
  const colors = TYPE_COLORS[typeKey] ?? TYPE_COLORS.general

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      display: 'flex', flexDirection: 'column',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.25)')}
    >
      {/* Card header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          padding: '3px 8px', borderRadius: 20,
          background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
        }}>
          {typeLabel}
        </span>
        {routine.is_template && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#6366F1', background: 'rgba(99,102,241,0.10)', padding: '3px 8px', borderRadius: 20 }}>
            Plantilla
          </span>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6, letterSpacing: '-0.02em' }}>
          {routine.name}
        </h3>
        {routine.description && (
          <p style={{
            fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.5, marginBottom: 10,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
            flex: 1,
          }}>
            {routine.description}
          </p>
        )}
        {routine.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            {routine.tags.map((tag: string) => (
              <span key={tag} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--color-surface-2)', color: 'var(--color-text-2)', border: '1px solid var(--color-border)' }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 10 }}>
          <Link
            href={`/dashboard/rutinas/${routine.id}`}
            style={{
              flex: 1, textAlign: 'center', padding: '8px',
              background: 'var(--color-text)', color: 'var(--color-surface)',
              borderRadius: 9, fontSize: 13, fontWeight: 600,
              textDecoration: 'none', transition: 'opacity 0.12s',
            }}
          >
            Editar
          </Link>
          <button
            onClick={onDelete}
            style={{
              padding: '8px 12px', background: 'transparent',
              border: '1px solid var(--color-border)', borderRadius: 9,
              fontSize: 13, color: 'var(--color-text-4)', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              transition: 'color 0.1s, border-color 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-4)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyRoutines({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16,
      padding: '64px 24px', textAlign: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,0.20)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ClipboardList size={22} color="#6366F1" />
        </div>
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Sin rutinas todavía</h3>
      <p style={{ fontSize: 14, color: 'var(--color-text-3)', marginBottom: 22, maxWidth: 360, margin: '0 auto 22px' }}>
        Crea planes de entrenamiento con bloques, series y ejercicios personalizados.
      </p>
      <button onClick={onAdd} style={{ background: '#C6FF00', color: '#0D1117', border: 'none', borderRadius: 10, padding: '9px 22px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 18, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(99,102,241,0.10)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={16} color="#6366F1" />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Nueva rutina</h2>
          </div>
          <button onClick={onClose} style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', color: 'var(--color-text-2)' }}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Nombre *
            </label>
            <input
              required autoFocus
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ej. Push Pull Legs — Semana 1"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              placeholder="Objetivo, notas generales..."
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Tipo
            </label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={{ ...inputStyle, appearance: 'none' as const }}>
              {ROUTINE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, color: 'var(--color-text-2)', userSelect: 'none' }}>
            <input type="checkbox" checked={form.is_template} onChange={e => setForm(p => ({ ...p, is_template: e.target.checked }))} />
            Guardar como plantilla
          </label>
          {error && (
            <div style={{ fontSize: 13, color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', padding: '8px 12px', borderRadius: 8 }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 13.5, cursor: 'pointer', background: 'transparent', color: 'var(--color-text-2)', fontWeight: 500 }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', background: loading ? 'var(--color-surface-2)' : '#6366F1', color: loading ? 'var(--color-text-3)' : '#fff', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Creando...' : 'Crear y editar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
