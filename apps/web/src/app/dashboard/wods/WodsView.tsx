'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWods, createWod, deleteWod, WOD_TYPES } from '@/lib/queries/wods'
import Link from 'next/link'

function formatSeconds(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}min`
}

export function WodsView() {
  const [showModal, setShowModal] = useState(false)
  const qc = useQueryClient()

  const { data: wods = [], isLoading } = useQuery({
    queryKey: ['wods'],
    queryFn: getWods,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWod,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wods'] }),
  })

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            WODs
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-3)', marginTop: 4 }}>
            {wods.length} {wods.length === 1 ? 'WOD' : 'WODs'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          + Nuevo WOD
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => <div key={i} style={{ height: 160, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : wods.length === 0 ? (
        <EmptyWods onAdd={() => setShowModal(true)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {wods.map((w: any) => (
            <WodCard key={w.id} wod={w} onDelete={() => {
              if (confirm('¿Eliminar este WOD?')) deleteMutation.mutate(w.id)
            }} />
          ))}
        </div>
      )}

      {showModal && (
        <NewWodModal
          onClose={() => setShowModal(false)}
          onSuccess={(id) => {
            setShowModal(false)
            qc.invalidateQueries({ queryKey: ['wods'] })
            window.location.href = `/dashboard/wods/${id}`
          }}
        />
      )}
    </div>
  )
}

function WodCard({ wod, onDelete }: { wod: any; onDelete: () => void }) {
  const typeInfo = WOD_TYPES.find(t => t.value === wod.type)

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '4px 10px', background: 'var(--color-surface-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-red)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {typeInfo?.label ?? wod.type}
        </span>
        {wod.is_template && (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)' }}>Plantilla</span>
        )}
      </div>

      <div style={{ padding: '14px 16px 12px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 6 }}>{wod.name}</h3>
        {wod.description && (
          <p style={{ fontSize: 13, color: 'var(--color-text-3)', lineHeight: 1.4, marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
            {wod.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {wod.time_cap_s && (
            <Tag>⏱ {formatSeconds(wod.time_cap_s)}</Tag>
          )}
          {wod.rounds && (
            <Tag>🔄 {wod.rounds} rondas</Tag>
          )}
          {wod.work_s && wod.rest_s && (
            <Tag>{formatSeconds(wod.work_s)} / {formatSeconds(wod.rest_s)}</Tag>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Link
            href={`/dashboard/wods/${wod.id}`}
            style={{ flex: 1, textAlign: 'center', padding: '7px', background: 'var(--color-surface-2)', color: 'var(--color-text-2)', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
          >
            Editar
          </Link>
          <button onClick={onDelete} style={{ padding: '7px 12px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--color-text-3)', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 12, padding: '3px 9px', borderRadius: 'var(--radius-full)', background: 'var(--color-surface-2)', color: 'var(--color-text-3)' }}>
      {children}
    </span>
  )
}

function EmptyWods({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '56px 24px', textAlign: 'center' }}>
      <p style={{ fontSize: 32, marginBottom: 12 }}>⏱️</p>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>Sin WODs todavía</h3>
      <p style={{ fontSize: 14, color: 'var(--color-text-3)', marginBottom: 20 }}>
        Crea workouts del día: AMRAP, EMOM, For Time, Tabata y más.
      </p>
      <button onClick={onAdd} style={{ background: 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        Crear primer WOD
      </button>
    </div>
  )
}

function NewWodModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (id: string) => void }) {
  const [form, setForm] = useState({ name: '', description: '', type: 'amrap', rounds: '', time_cap_s: '', work_s: '', rest_s: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedType = WOD_TYPES.find(t => t.value === form.type)
  const showRounds = ['amrap', 'emom', 'for_time'].includes(form.type)
  const showTimeCap = ['for_time', 'amrap', 'chipper', 'custom'].includes(form.type)
  const showInterval = ['emom', 'tabata', 'intervals'].includes(form.type)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const wod = await createWod({
        name: form.name,
        type: form.type,
        description: form.description || undefined,
        rounds: form.rounds ? Number(form.rounds) : undefined,
        time_cap_s: form.time_cap_s ? Number(form.time_cap_s) * 60 : undefined,
        work_s: form.work_s ? Number(form.work_s) : undefined,
        rest_s: form.rest_s ? Number(form.rest_s) : undefined,
      })
      onSuccess(wod.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear WOD')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 1 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>Nuevo WOD</h2>
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
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 8 }}>Tipo de WOD</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {WOD_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: t.value }))}
                  style={{
                    padding: '10px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                    border: `1.5px solid ${form.type === t.value ? 'var(--color-red)' : 'var(--color-border)'}`,
                    background: form.type === t.value ? 'var(--color-red-muted)' : 'var(--color-surface)',
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 700, color: form.type === t.value ? 'var(--color-red)' : 'var(--color-text)', marginBottom: 2 }}>{t.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>Descripción</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: showRounds && showTimeCap ? '1fr 1fr' : '1fr', gap: 12 }}>
            {showRounds && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>Rondas</label>
                <input type="number" value={form.rounds} onChange={e => setForm(p => ({ ...p, rounds: e.target.value }))} placeholder="Ej. 5" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            )}
            {showTimeCap && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>Tiempo límite (minutos)</label>
                <input type="number" value={form.time_cap_s} onChange={e => setForm(p => ({ ...p, time_cap_s: e.target.value }))} placeholder="Ej. 20" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            )}
          </div>

          {showInterval && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>
                  {form.type === 'emom' ? 'Duración por minuto (s)' : 'Tiempo de trabajo (s)'}
                </label>
                <input type="number" value={form.work_s} onChange={e => setForm(p => ({ ...p, work_s: e.target.value }))} placeholder={form.type === 'emom' ? '60' : '20'} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>Descanso (s)</label>
                <input type="number" value={form.rest_s} onChange={e => setForm(p => ({ ...p, rest_s: e.target.value }))} placeholder="10" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            </div>
          )}

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
