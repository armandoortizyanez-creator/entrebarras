'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAthletes, createAthlete, deleteAthlete } from '@/lib/queries/athletes'
import type { Athlete } from '@entrebarras/types'

type FilterStatus = 'all' | 'active' | 'inactive' | 'prospect'

export function AthletesView() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<FilterStatus>('all')
  const [showModal, setShowModal] = useState(false)

  const qc = useQueryClient()

  const { data: athletes = [], isLoading } = useQuery({
    queryKey: ['athletes', status],
    queryFn: () => getAthletes({ status: status === 'all' ? undefined : status }),
  })

  const filtered = athletes.filter(a =>
    search === '' ||
    `${a.first_name} ${a.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  )

  const deleteMutation = useMutation({
    mutationFn: deleteAthlete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['athletes'] }),
  })

  const tabs: { label: string; value: FilterStatus }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' },
    { label: 'Prospectos', value: 'prospect' },
  ]

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            Atletas
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-3)', marginTop: 4 }}>
            {athletes.length} {athletes.length === 1 ? 'atleta registrado' : 'atletas registrados'}
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
          + Nuevo atleta
        </button>
      </div>

      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 200, padding: '8px 12px',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)',
              outline: 'none',
            }}
          />

          <div style={{ display: 'flex', gap: 4 }}>
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-md)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  border: '1px solid',
                  borderColor: status === tab.value ? 'var(--color-red)' : 'var(--color-border)',
                  background: status === tab.value ? 'var(--color-red)' : 'transparent',
                  color: status === tab.value ? '#fff' : 'var(--color-text-2)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-3)' }}>
            Cargando atletas...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onAdd={() => setShowModal(true)} hasSearch={search.length > 0} />
        ) : (
          <AthleteTable athletes={filtered} onDelete={id => deleteMutation.mutate(id)} />
        )}
      </div>

      {showModal && (
        <NewAthleteModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            qc.invalidateQueries({ queryKey: ['athletes'] })
          }}
        />
      )}
    </div>
  )
}

function AthleteTable({ athletes, onDelete }: { athletes: Athlete[]; onDelete: (id: string) => void }) {
  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 160px 100px 100px 80px',
        padding: '10px 20px', borderBottom: '1px solid var(--color-border)',
        fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        <span>Atleta</span>
        <span>Deporte</span>
        <span>Nivel</span>
        <span>Estado</span>
        <span></span>
      </div>

      {athletes.map((athlete, i) => (
        <div
          key={athlete.id}
          style={{
            display: 'grid', gridTemplateColumns: '1fr 160px 100px 100px 80px',
            padding: '14px 20px', alignItems: 'center',
            borderBottom: i < athletes.length - 1 ? '1px solid var(--color-border)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={`${athlete.first_name} ${athlete.last_name}`} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                {athlete.first_name} {athlete.last_name}
              </p>
              {athlete.email && (
                <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{athlete.email}</p>
              )}
            </div>
          </div>

          <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
            {athlete.primary_sport ?? 'No definido'}
          </span>

          <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
            {levelLabel(athlete.sport_level)}
          </span>

          <StatusBadge status={athlete.status} />

          <button
            onClick={() => {
              if (confirm('¿Eliminar este atleta?')) onDelete(athlete.id)
            }}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 13, color: 'var(--color-text-3)', padding: 4,
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: 'var(--color-surface-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 600, color: 'var(--color-text-2)', flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: 'Activo', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
    inactive: { label: 'Inactivo', color: 'var(--color-text-3)', bg: 'var(--color-surface-2)' },
    prospect: { label: 'Prospecto', color: 'var(--color-info)', bg: 'var(--color-info-bg)' },
  }
  const s = map[status ?? 'active'] ?? map.active

  return (
    <span style={{
      display: 'inline-block', fontSize: 12, fontWeight: 500,
      color: s.color, background: s.bg,
      padding: '3px 10px', borderRadius: 'var(--radius-full)',
    }}>
      {s.label}
    </span>
  )
}

function levelLabel(level: string | null) {
  const map: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    competitive: 'Competitivo',
  }
  return level ? (map[level] ?? level) : 'No definido'
}

function EmptyState({ onAdd, hasSearch }: { onAdd: () => void; hasSearch: boolean }) {
  return (
    <div style={{ padding: '56px 24px', textAlign: 'center' }}>
      <p style={{ fontSize: 28, marginBottom: 12 }}>🏃</p>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
        {hasSearch ? 'Sin resultados' : 'Aún no hay atletas'}
      </h3>
      <p style={{ fontSize: 14, color: 'var(--color-text-3)', marginBottom: 20 }}>
        {hasSearch ? 'Intenta con otro nombre o email.' : 'Comienza agregando tu primer atleta.'}
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
          Agregar atleta
        </button>
      )}
    </div>
  )
}

function NewAthleteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', primary_sport: '', sport_level: '', status: 'active' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const qc = useQueryClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await createAthlete({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        primary_sport: form.primary_sport || undefined,
        sport_level: (form.sport_level as Athlete['sport_level']) || undefined,
        status: form.status as Athlete['status'],
      })
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const levels = [
    { value: 'beginner', label: 'Principiante' },
    { value: 'intermediate', label: 'Intermedio' },
    { value: 'advanced', label: 'Avanzado' },
    { value: 'competitive', label: 'Competitivo' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: 480,
        boxShadow: 'var(--shadow-xl)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid var(--color-border)',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>
            Nuevo atleta
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--color-text-3)' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ModalField label="Nombre" value={form.first_name} onChange={v => setForm(p => ({ ...p, first_name: v }))} required />
            <ModalField label="Apellido" value={form.last_name} onChange={v => setForm(p => ({ ...p, last_name: v }))} required />
          </div>
          <ModalField label="Email" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} />
          <ModalField label="Teléfono" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
          <ModalField label="Deporte principal" value={form.primary_sport} onChange={v => setForm(p => ({ ...p, primary_sport: v }))} />

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>
              Nivel
            </label>
            <select
              value={form.sport_level}
              onChange={e => setForm(p => ({ ...p, sport_level: e.target.value }))}
              style={{
                width: '100%', padding: '9px 12px',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)',
              }}
            >
              <option value="">Sin definir</option>
              {levels.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '10px', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', background: 'transparent', color: 'var(--color-text)',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: '10px',
                background: loading ? 'var(--color-border)' : 'var(--color-red)',
                color: loading ? 'var(--color-text-3)' : '#fff',
                border: 'none', borderRadius: 'var(--radius-md)',
                fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Guardando...' : 'Guardar atleta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalField({ label, value, onChange, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; required?: boolean
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
        style={{
          width: '100%', padding: '9px 12px',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
          fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)',
          boxSizing: 'border-box', outline: 'none',
        }}
      />
    </div>
  )
}
