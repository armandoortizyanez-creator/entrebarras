'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWod, addMovement, updateMovement, removeMovement, WOD_TYPES } from '@/lib/queries/wods'
import type { WodMovementFull } from '@/lib/queries/wods'
import { getWodResults, deleteWodResult, SCALE_LABELS, SCALE_COLORS, buildResultText } from '@/lib/queries/wod-results'
import type { WodResult } from '@/lib/queries/wod-results'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, GripVertical, Clock, RotateCcw, Zap, Timer, Play, Trophy, X as XIcon } from 'lucide-react'
import { WodTimer } from './WodTimer'

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  amrap:     { bg: 'rgba(129,140,248,0.12)', text: '#818CF8', border: 'rgba(129,140,248,0.25)' },
  emom:      { bg: 'rgba(167,139,250,0.12)', text: '#A78BFA', border: 'rgba(167,139,250,0.25)' },
  for_time:  { bg: 'rgba(198,255,0,0.10)',   text: '#C6FF00', border: 'rgba(198,255,0,0.20)'  },
  tabata:    { bg: 'rgba(244,114,182,0.10)', text: '#F472B6', border: 'rgba(244,114,182,0.20)' },
  chipper:   { bg: 'rgba(52,211,153,0.10)',  text: '#34D399', border: 'rgba(52,211,153,0.20)'  },
  intervals: { bg: 'rgba(251,191,36,0.10)',  text: '#FBBF24', border: 'rgba(251,191,36,0.20)'  },
  custom:    { bg: 'rgba(138,147,168,0.10)', text: '#8A93A8', border: 'rgba(138,147,168,0.20)' },
}

function formatSeconds(s: number | null) {
  if (!s) return ''
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}min${s % 60 > 0 ? ` ${s % 60}s` : ''}`
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px',
  border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13,
  color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box',
  outline: 'none', transition: 'border-color 0.15s',
}

export function WodBuilder({ wodId }: { wodId: string }) {
  const qc = useQueryClient()
  const [addingMovement, setAddingMovement] = useState(false)
  const [newMovement, setNewMovement] = useState({ name: '', reps: '', weight_kg: '', distance_m: '', calories: '' })
  const [timerOpen, setTimerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'movimientos' | 'resultados'>('movimientos')

  const { data: wod, isLoading } = useQuery({
    queryKey: ['wod', wodId],
    queryFn: () => getWod(wodId),
  })

  const removeMutation = useMutation({
    mutationFn: removeMovement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wod', wodId] }),
  })

  async function handleAddMovement(e: React.FormEvent) {
    e.preventDefault()
    if (!newMovement.name) return
    await addMovement(wodId, {
      name: newMovement.name,
      order_index: wod?.movements.length ?? 0,
      reps: newMovement.reps || undefined,
      weight_kg: newMovement.weight_kg ? Number(newMovement.weight_kg) : undefined,
      distance_m: newMovement.distance_m ? Number(newMovement.distance_m) : undefined,
      calories: newMovement.calories ? Number(newMovement.calories) : undefined,
    })
    qc.invalidateQueries({ queryKey: ['wod', wodId] })
    setNewMovement({ name: '', reps: '', weight_kg: '', distance_m: '', calories: '' })
    setAddingMovement(false)
  }

  if (isLoading) return (
    <div style={{ padding: '48px 40px', color: 'var(--color-text-3)', fontSize: 14 }}>Cargando WOD...</div>
  )
  if (!wod) return (
    <div style={{ padding: '48px 40px', color: '#EF4444', fontSize: 14 }}>WOD no encontrado</div>
  )

  const typeInfo = WOD_TYPES.find(t => t.value === wod.type)
  const tc = TYPE_COLORS[wod.type] ?? TYPE_COLORS.custom
  const metaItems = [
    wod.time_cap_s && { icon: <Clock size={13} />, label: 'Tiempo límite', value: formatSeconds(wod.time_cap_s) },
    wod.rounds     && { icon: <RotateCcw size={13} />, label: 'Rondas', value: String(wod.rounds) },
    wod.work_s     && { icon: <Zap size={13} />, label: 'Trabajo', value: formatSeconds(wod.work_s) },
    wod.rest_s     && { icon: <Timer size={13} />, label: 'Descanso', value: formatSeconds(wod.rest_s) },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[]

  return (
    <div style={{ padding: '36px 40px', maxWidth: 760 }}>

      {/* Back */}
      <Link href="/dashboard/wods" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none',
        fontWeight: 500, marginBottom: 24,
      }}>
        <ArrowLeft size={15} />
        Volver a WODs
      </Link>

      {/* Header card */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.20)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{
                fontSize: 24, fontWeight: 800, color: 'var(--color-text)',
                letterSpacing: '-0.04em', lineHeight: 1.1,
              }}>
                {wod.name}
              </h1>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                textTransform: 'uppercase', padding: '4px 10px',
                borderRadius: 20, border: `1px solid ${tc.border}`,
                background: tc.bg, color: tc.text,
              }}>
                {typeInfo?.label ?? wod.type}
              </span>
            </div>
            {wod.description && (
              <p style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.5, maxWidth: 480 }}>
                {wod.description}
              </p>
            )}
          </div>

          {/* Timer button */}
          <button
            onClick={() => setTimerOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#C6FF00', color: '#0D1117', border: 'none',
              borderRadius: 10, padding: '9px 16px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              flexShrink: 0, transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Play size={14} fill="#0D1117" />
            Iniciar Timer
          </button>
        </div>

        {metaItems.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            {metaItems.map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                borderRadius: 8, padding: '6px 12px',
              }}>
                <span style={{ color: 'var(--color-text-3)' }}>{m.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{m.value}</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{m.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['movimientos', 'resultados'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 9, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: 'none',
              background: activeTab === tab ? 'var(--color-red)' : 'var(--color-surface-2)',
              color: activeTab === tab ? '#fff' : 'var(--color-text-2)',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'movimientos' ? <Zap size={13} /> : <Trophy size={13} />}
            {tab === 'movimientos' ? 'Movimientos' : 'Resultados'}
          </button>
        ))}
      </div>

      {activeTab === 'resultados' && (
        <WodLeaderboard wodId={wodId} />
      )}

      {activeTab === 'movimientos' && (
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.20)',
      }}>
        {/* Card header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Movimientos
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              background: 'var(--color-surface-2)', color: 'var(--color-text-2)',
              borderRadius: 20, padding: '2px 8px',
            }}>
              {wod.movements.length}
            </span>
          </div>
          {!addingMovement && (
            <button
              onClick={() => setAddingMovement(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 13, fontWeight: 600, color: '#6366F1',
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.20)',
                borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
              }}
            >
              <Plus size={13} />
              Agregar
            </button>
          )}
        </div>

        {/* Empty */}
        {wod.movements.length === 0 && !addingMovement && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <Zap size={20} color="#6366F1" />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>Sin movimientos</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Agrega los ejercicios que componen este WOD.</p>
          </div>
        )}

        {/* Movement rows */}
        {wod.movements.map((m, i) => (
          <MovementRow
            key={m.id}
            movement={m}
            number={i + 1}
            isLast={i === wod.movements.length - 1}
            onRemove={() => removeMutation.mutate(m.id)}
            onUpdate={(updates) => {
              updateMovement(m.id, updates).then(() =>
                qc.invalidateQueries({ queryKey: ['wod', wodId] })
              )
            }}
          />
        ))}

        {/* Add form */}
        {addingMovement && (<form onSubmit={handleAddMovement} style={{
            padding: '16px 20px',
            borderTop: wod.movements.length > 0 ? '1px solid var(--color-border)' : 'none',
            background: 'var(--color-surface-2)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Nuevo movimiento
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[
                { label: 'Ejercicio *', key: 'name', type: 'text', placeholder: 'Ej. Wall Ball' },
                { label: 'Reps', key: 'reps', type: 'text', placeholder: '21' },
                { label: 'Kg', key: 'weight_kg', type: 'number', placeholder: '20' },
                { label: 'Metros', key: 'distance_m', type: 'number', placeholder: '400' },
                { label: 'Cal', key: 'calories', type: 'number', placeholder: '50' },
              ].map((f, fi) => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 4 }}>{f.label}</label>
                  <input
                    autoFocus={fi === 0}
                    required={fi === 0}
                    type={f.type}
                    value={(newMovement as any)[f.key]}
                    onChange={e => setNewMovement(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => { setAddingMovement(false); setNewMovement({ name: '', reps: '', weight_kg: '', distance_m: '', calories: '' }) }}
                style={{
                  padding: '8px 16px', fontSize: 13, fontWeight: 500,
                  border: '1px solid var(--color-border)', borderRadius: 8,
                  background: 'var(--color-surface)', color: 'var(--color-text-2)', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 18px', fontSize: 13, fontWeight: 600,
                  background: '#6366F1', color: '#fff',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                }}
              >
                Agregar movimiento
              </button>
            </div>
          </form>
        )}
      </div>
      )}

      {/* Live Timer */}
      {timerOpen && (
        <WodTimer
          wod={{
            name: wod.name,
            type: wod.type,
            time_cap_s: wod.time_cap_s ?? null,
            rounds: wod.rounds ?? null,
            work_s: wod.work_s ?? null,
            rest_s: wod.rest_s ?? null,
            movements: wod.movements.map(m => ({
              name: m.name,
              reps: m.reps,
              weight_kg: m.weight_kg,
              distance_m: m.distance_m,
              calories: m.calories,
            })),
          }}
          wodId={wodId}
          onClose={() => setTimerOpen(false)}
          onResultSaved={() => {
            qc.invalidateQueries({ queryKey: ['wod-results', wodId] })
            setActiveTab('resultados')
          }}
        />
      )}
    </div>
  )
}

// Leaderboard/results panel
function WodLeaderboard({ wodId }: { wodId: string }) {
  const qc = useQueryClient()
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['wod-results', wodId],
    queryFn: () => getWodResults(wodId),
  })

  const delMutation = useMutation({
    mutationFn: deleteWodResult,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wod-results', wodId] }),
  })

  if (isLoading) return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '40px 24px', textAlign: 'center', color: 'var(--color-text-3)', fontSize: 14 }}>
      Cargando resultados...
    </div>
  )

  if (results.length === 0) return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.20)' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(198,255,0,0.10)', border: '1px solid rgba(198,255,0,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
        <Trophy size={20} color="#C6FF00" />
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>Sin resultados aún</p>
      <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Inicia el timer y guarda tu primer resultado.</p>
    </div>
  )

  // Group by scale, then rank within each group
  const byScale: Record<string, WodResult[]> = {}
  results.forEach(r => {
    if (!byScale[r.scale]) byScale[r.scale] = []
    byScale[r.scale].push(r)
  })

  // Sort: for time = ascending time_s, else descending reps/rounds
  const scaleOrder = ['rx', 'scaled', 'foundations']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {scaleOrder.filter(s => byScale[s]).map(scale => {
        const sc = SCALE_COLORS[scale]
        const rows = byScale[scale].sort((a, b) => {
          if (a.time_s != null && b.time_s != null) return a.time_s - b.time_s
          const aScore = (a.rounds ?? 0) * 1000 + (a.reps ?? 0)
          const bScore = (b.rounds ?? 0) * 1000 + (b.reps ?? 0)
          return bScore - aScore
        })

        return (
          <div key={scale} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.20)' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={13} color={sc.text} />
              <span style={{ fontSize: 12, fontWeight: 700, color: sc.text, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {SCALE_LABELS[scale]}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.text, borderRadius: 20, padding: '2px 7px', border: `1px solid ${sc.border}` }}>
                {rows.length}
              </span>
            </div>
            {rows.map((r, idx) => {
              const athleteName = r.athlete ? `${r.athlete.first_name} ${r.athlete.last_name}` : 'Atleta desconocido'
              const resultDisplay = buildResultText(r)
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null

              return (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px',
                  borderBottom: idx < rows.length - 1 ? '1px solid var(--color-border)' : 'none',
                  background: idx === 0 ? 'rgba(198,255,0,0.06)' : 'transparent',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-3)', width: 20, textAlign: 'center' }}>
                    {medal ?? `${idx + 1}`}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{athleteName}</p>
                    {r.notes && <p style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 1 }}>{r.notes}</p>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                      {resultDisplay}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{r.recorded_at}</p>
                  </div>
                  <button onClick={() => delMutation.mutate(r.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-border)', display: 'flex', alignItems: 'center' }}
                    title="Eliminar resultado"
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function MovementRow({ movement, number, isLast, onRemove, onUpdate }: {
  movement: WodMovementFull; number: number; isLast: boolean
  onRemove: () => void; onUpdate: (u: Partial<WodMovementFull>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState({
    name: movement.name,
    reps: movement.reps ?? '',
    weight_kg: movement.weight_kg ?? '',
    distance_m: movement.distance_m ?? '',
    calories: movement.calories ?? '',
  })

  function save() {
    onUpdate({
      name: local.name,
      reps: String(local.reps) || undefined,
      weight_kg: local.weight_kg ? Number(local.weight_kg) : undefined,
      distance_m: local.distance_m ? Number(local.distance_m) : undefined,
      calories: local.calories ? Number(local.calories) : undefined,
    })
    setEditing(false)
  }

  const specs = [
    movement.reps && `${movement.reps} reps`,
    movement.weight_kg && `${movement.weight_kg} kg`,
    movement.distance_m && `${movement.distance_m} m`,
    movement.calories && `${movement.calories} cal`,
  ].filter(Boolean).join(' · ')

  return (
    <div style={{ borderBottom: isLast && !editing ? 'none' : '1px solid var(--color-border)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px',
      }}>
        <GripVertical size={14} color="var(--color-border)" style={{ flexShrink: 0, cursor: 'grab' }} />
        <span style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'var(--color-red)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>
          {number}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{movement.name}</p>
          {specs && <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 1 }}>{specs}</p>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setEditing(e => !e)}
            style={{
              fontSize: 12, padding: '5px 11px', fontWeight: 500,
              border: '1px solid var(--color-border)', borderRadius: 7, cursor: 'pointer',
              background: editing ? 'var(--color-surface-2)' : 'transparent',
              color: 'var(--color-text-2)', transition: 'all 0.12s',
            }}
          >
            {editing ? 'Cerrar' : 'Editar'}
          </button>
          <button
            onClick={onRemove}
            style={{
              padding: '5px 8px', border: '1px solid var(--color-border)',
              borderRadius: 7, cursor: 'pointer', background: 'transparent',
              color: 'var(--color-text-3)', display: 'flex', alignItems: 'center',
              transition: 'all 0.12s',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {editing && (
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'Ejercicio', key: 'name', type: 'text' },
              { label: 'Reps', key: 'reps', type: 'text' },
              { label: 'Kg', key: 'weight_kg', type: 'number' },
              { label: 'Metros', key: 'distance_m', type: 'number' },
              { label: 'Cal', key: 'calories', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 4 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={(local as any)[f.key]}
                  onChange={e => setLocal(p => ({ ...p, [f.key]: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={save}
              style={{
                padding: '7px 16px', fontSize: 13, fontWeight: 600,
                background: 'var(--color-red)', color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
              }}
            >
              Guardar cambios
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
