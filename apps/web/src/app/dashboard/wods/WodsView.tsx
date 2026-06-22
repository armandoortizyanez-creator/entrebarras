'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWods, createWod, deleteWod, WOD_TYPES } from '@/lib/queries/wods'
import Link from 'next/link'
import { Plus, Timer, RotateCcw, Zap, Clock, ChevronRight, Trash2 } from 'lucide-react'

function formatSeconds(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}min`
}

// Color por tipo de WOD
const TYPE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  amrap:       { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  emom:        { bg: '#F5F3FF', text: '#6D28D9', dot: '#8B5CF6' },
  for_time:    { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  tabata:      { bg: '#FDF2F8', text: '#9D174D', dot: '#EC4899' },
  chipper:     { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  intervals:   { bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B' },
  custom:      { bg: '#F8FAFC', text: '#475569', dot: '#94A3B8' },
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
    <div style={{ padding: '32px 36px', maxWidth: 1180 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.03em', marginBottom: 3 }}>
            WODs
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-3)' }}>
            {isLoading ? '...' : `${wods.length} workout${wods.length !== 1 ? 's' : ''} creados`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--color-red)', color: '#fff',
            border: 'none', borderRadius: 10,
            padding: '9px 18px', fontSize: 13.5, fontWeight: 600,
            cursor: 'pointer', letterSpacing: '-0.01em',
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          Nuevo WOD
        </button>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <WodsSkeleton />
      ) : wods.length === 0 ? (
        <EmptyWods onAdd={() => setShowModal(true)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {wods.map((w: any) => (
            <WodCard
              key={w.id}
              wod={w}
              onDelete={() => {
                if (confirm('¿Eliminar este WOD?')) deleteMutation.mutate(w.id)
              }}
            />
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
  const style = TYPE_STYLES[wod.type] ?? TYPE_STYLES.custom
  const movCount = wod.movements?.length ?? 0

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 14,
      overflow: 'hidden',
      transition: 'box-shadow 0.15s, transform 0.15s',
      cursor: 'pointer',
    }}
    onMouseEnter={e => {
      const el = e.currentTarget as HTMLElement
      el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
      el.style.transform = 'translateY(-1px)'
    }}
    onMouseLeave={e => {
      const el = e.currentTarget as HTMLElement
      el.style.boxShadow = 'none'
      el.style.transform = 'translateY(0)'
    }}
    >
      {/* Color bar top */}
      <div style={{ height: 4, background: style.dot }} />

      <div style={{ padding: '16px 18px 14px' }}>
        {/* Badge de tipo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: style.text, background: style.bg,
            padding: '4px 10px', borderRadius: 999,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            {typeInfo?.label ?? wod.type}
          </span>
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onDelete() }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-4)', padding: 4, borderRadius: 6,
              transition: 'color 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-error)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--color-text-4)'}
          >
            <Trash2 size={13} strokeWidth={2} />
          </button>
        </div>

        {/* Nombre */}
        <h3 style={{
          fontSize: 16, fontWeight: 700,
          color: 'var(--color-text)',
          letterSpacing: '-0.02em',
          marginBottom: 6, lineHeight: 1.25,
        }}>
          {wod.name}
        </h3>

        {wod.description && (
          <p style={{
            fontSize: 13, color: 'var(--color-text-3)',
            lineHeight: 1.45, marginBottom: 14,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
          }}>
            {wod.description}
          </p>
        )}

        {/* Métricas */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
          {wod.time_cap_s && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={12} color="var(--color-text-3)" strokeWidth={2} />
              <span style={{ fontSize: 12.5, color: 'var(--color-text-3)', fontWeight: 500 }}>
                {formatSeconds(wod.time_cap_s)}
              </span>
            </div>
          )}
          {wod.rounds && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <RotateCcw size={12} color="var(--color-text-3)" strokeWidth={2} />
              <span style={{ fontSize: 12.5, color: 'var(--color-text-3)', fontWeight: 500 }}>
                {wod.rounds} rondas
              </span>
            </div>
          )}
          {wod.work_s && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Zap size={12} color="var(--color-text-3)" strokeWidth={2} />
              <span style={{ fontSize: 12.5, color: 'var(--color-text-3)', fontWeight: 500 }}>
                {formatSeconds(wod.work_s)}/{formatSeconds(wod.rest_s)}
              </span>
            </div>
          )}
          {movCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Timer size={12} color="var(--color-text-3)" strokeWidth={2} />
              <span style={{ fontSize: 12.5, color: 'var(--color-text-3)', fontWeight: 500 }}>
                {movCount} movimiento{movCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        <Link
          href={`/dashboard/wods/${wod.id}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 14px',
            background: 'var(--color-surface-2)',
            borderRadius: 8,
            textDecoration: 'none',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-border)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-2)' }}>
            Ver y editar
          </span>
          <ChevronRight size={14} color="var(--color-text-3)" strokeWidth={2} />
        </Link>
      </div>
    </div>
  )
}

function EmptyWods({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 14,
      padding: '64px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: '#FFF7ED', border: '1px solid #FED7AA',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 18px',
      }}>
        <Zap size={22} color="#F97316" strokeWidth={2} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', marginBottom: 8 }}>
        Sin WODs todavía
      </h3>
      <p style={{ fontSize: 13.5, color: 'var(--color-text-3)', marginBottom: 24, lineHeight: 1.6, maxWidth: 320, margin: '0 auto 24px' }}>
        Crea workouts del día: AMRAP, EMOM, For Time, Tabata y más.
      </p>
      <button
        onClick={onAdd}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'var(--color-red)', color: '#fff',
          border: 'none', borderRadius: 10,
          padding: '10px 22px', fontSize: 14, fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <Plus size={15} strokeWidth={2.5} />
        Crear primer WOD
      </button>
    </div>
  )
}

function WodsSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          height: 200, borderRadius: 14,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          animation: 'pulse-skeleton 1.6s ease-in-out infinite',
        }} />
      ))}
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

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    border: '1px solid var(--color-border)',
    borderRadius: 8, fontSize: 14,
    color: 'var(--color-text)',
    background: 'var(--color-surface)',
    boxSizing: 'border-box' as const,
    outline: 'none',
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: 13, fontWeight: 500,
    color: 'var(--color-text-2)',
    marginBottom: 5,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 16, width: '100%', maxWidth: 500,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 22px',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky', top: 0,
          background: 'var(--color-surface)', zIndex: 1,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            Nuevo WOD
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'var(--color-surface-2)', border: 'none',
              borderRadius: 8, width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 16, color: 'var(--color-text-3)',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Nombre */}
          <div>
            <label style={labelStyle}>
              Nombre <span style={{ color: 'var(--color-red)' }}>*</span>
            </label>
            <input
              required
              placeholder="Ej. Murph, Fran, 21-15-9..."
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              style={inputStyle}
            />
          </div>

          {/* Tipo */}
          <div>
            <label style={labelStyle}>Tipo de WOD</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {WOD_TYPES.map(t => {
                const ts = TYPE_STYLES[t.value] ?? TYPE_STYLES.custom
                const isSelected = form.type === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, type: t.value }))}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                      border: `1.5px solid ${isSelected ? ts.dot : 'var(--color-border)'}`,
                      background: isSelected ? ts.bg : 'var(--color-surface)',
                      transition: 'all 0.12s',
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 700, color: isSelected ? ts.text : 'var(--color-text)', marginBottom: 2 }}>
                      {t.label}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-3)', lineHeight: 1.3 }}>{t.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label style={labelStyle}>Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              placeholder="Descripción opcional del workout..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Rondas + Tiempo */}
          {(showRounds || showTimeCap) && (
            <div style={{ display: 'grid', gridTemplateColumns: showRounds && showTimeCap ? '1fr 1fr' : '1fr', gap: 12 }}>
              {showRounds && (
                <div>
                  <label style={labelStyle}>Rondas</label>
                  <input
                    type="number"
                    value={form.rounds}
                    onChange={e => setForm(p => ({ ...p, rounds: e.target.value }))}
                    placeholder="Ej. 5"
                    style={inputStyle}
                  />
                </div>
              )}
              {showTimeCap && (
                <div>
                  <label style={labelStyle}>Tiempo límite (min)</label>
                  <input
                    type="number"
                    value={form.time_cap_s}
                    onChange={e => setForm(p => ({ ...p, time_cap_s: e.target.value }))}
                    placeholder="Ej. 20"
                    style={inputStyle}
                  />
                </div>
              )}
            </div>
          )}

          {/* Intervalos */}
          {showInterval && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>
                  {form.type === 'emom' ? 'Duración/minuto (s)' : 'Trabajo (s)'}
                </label>
                <input
                  type="number"
                  value={form.work_s}
                  onChange={e => setForm(p => ({ ...p, work_s: e.target.value }))}
                  placeholder={form.type === 'emom' ? '60' : '20'}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Descanso (s)</label>
                <input
                  type="number"
                  value={form.rest_s}
                  onChange={e => setForm(p => ({ ...p, rest_s: e.target.value }))}
                  placeholder="10"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {error && (
            <p style={{
              fontSize: 13, color: 'var(--color-error)',
              background: 'var(--color-error-bg)',
              padding: '8px 12px', borderRadius: 8,
            }}>
              {error}
            </p>
          )}

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '10px',
                border: '1px solid var(--color-border)',
                borderRadius: 9, fontSize: 14, cursor: 'pointer',
                background: 'transparent', color: 'var(--color-text)',
                fontWeight: 500,
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
                border: 'none', borderRadius: 9,
                fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creando...' : 'Crear WOD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
