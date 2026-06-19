'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWod, addMovement, updateMovement, removeMovement, WOD_TYPES } from '@/lib/queries/wods'
import type { WodMovementFull } from '@/lib/queries/wods'
import Link from 'next/link'

function formatSeconds(s: number | null) {
  if (!s) return ''
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}min${s % 60 > 0 ? ` ${s % 60}s` : ''}`
}

export function WodBuilder({ wodId }: { wodId: string }) {
  const qc = useQueryClient()
  const [addingMovement, setAddingMovement] = useState(false)
  const [newMovement, setNewMovement] = useState({ name: '', reps: '', weight_kg: '', distance_m: '', calories: '' })

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

  if (isLoading) return <div style={{ padding: 40, color: 'var(--color-text-3)' }}>Cargando WOD...</div>
  if (!wod) return <div style={{ padding: 40, color: 'var(--color-error)' }}>WOD no encontrado</div>

  const typeInfo = WOD_TYPES.find(t => t.value === wod.type)

  return (
    <div style={{ padding: '32px 40px', maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
        <Link href="/dashboard/wods" style={{ fontSize: 20, color: 'var(--color-text-3)', textDecoration: 'none', marginTop: 2 }}>←</Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              {wod.name}
            </h1>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-red)', background: 'var(--color-red-muted)', padding: '3px 10px', borderRadius: 'var(--radius-full)', textTransform: 'uppercase' }}>
              {typeInfo?.label ?? wod.type}
            </span>
          </div>
          {wod.description && (
            <p style={{ fontSize: 14, color: 'var(--color-text-3)', marginBottom: 8 }}>{wod.description}</p>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            {wod.time_cap_s && <MetaChip label="Tiempo límite" value={formatSeconds(wod.time_cap_s)} />}
            {wod.rounds && <MetaChip label="Rondas" value={String(wod.rounds)} />}
            {wod.work_s && <MetaChip label="Trabajo" value={formatSeconds(wod.work_s)} />}
            {wod.rest_s && <MetaChip label="Descanso" value={formatSeconds(wod.rest_s)} />}
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Movimientos ({wod.movements.length})
          </p>
        </div>

        {wod.movements.length === 0 && !addingMovement && (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--color-text-3)', fontSize: 14 }}>
            Agrega los movimientos de este WOD.
          </div>
        )}

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

        {addingMovement ? (
          <form onSubmit={handleAddMovement} style={{ padding: '14px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-3)', marginBottom: 4 }}>Movimiento *</label>
                <input autoFocus required value={newMovement.name} onChange={e => setNewMovement(p => ({ ...p, name: e.target.value }))} placeholder="Ej. Wall Ball" style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-3)', marginBottom: 4 }}>Reps</label>
                <input value={newMovement.reps} onChange={e => setNewMovement(p => ({ ...p, reps: e.target.value }))} placeholder="21" style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-3)', marginBottom: 4 }}>Peso (kg)</label>
                <input type="number" value={newMovement.weight_kg} onChange={e => setNewMovement(p => ({ ...p, weight_kg: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-3)', marginBottom: 4 }}>Metros</label>
                <input type="number" value={newMovement.distance_m} onChange={e => setNewMovement(p => ({ ...p, distance_m: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-3)', marginBottom: 4 }}>Calorías</label>
                <input type="number" value={newMovement.calories} onChange={e => setNewMovement(p => ({ ...p, calories: e.target.value }))} style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setAddingMovement(false)} style={{ padding: '7px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, cursor: 'pointer', background: 'transparent', color: 'var(--color-text)' }}>Cancelar</button>
              <button type="submit" style={{ padding: '7px 16px', background: 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Agregar</button>
            </div>
          </form>
        ) : (
          <div style={{ padding: '12px 16px', borderTop: wod.movements.length > 0 ? '1px solid var(--color-border)' : 'none' }}>
            <button onClick={() => setAddingMovement(true)} style={{ fontSize: 13, color: 'var(--color-red)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}>
              + Agregar movimiento
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
      <span style={{ fontWeight: 600, color: 'var(--color-text-2)' }}>{value}</span> {label}
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
      reps: local.reps || undefined,
      weight_kg: local.weight_kg ? Number(local.weight_kg) : undefined,
      distance_m: local.distance_m ? Number(local.distance_m) : undefined,
      calories: local.calories ? Number(local.calories) : undefined,
    })
    setEditing(false)
  }

  const specs = [
    movement.reps && `${movement.reps} reps`,
    movement.weight_kg && `${movement.weight_kg} kg`,
    movement.distance_m && `${movement.distance_m}m`,
    movement.calories && `${movement.calories} cal`,
  ].filter(Boolean).join(' · ')

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
        <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-red)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
          {number}
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>{movement.name}</p>
          {specs && <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{specs}</p>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setEditing(!editing)} style={{ fontSize: 12, padding: '5px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: editing ? 'var(--color-surface-2)' : 'transparent', color: 'var(--color-text-2)' }}>
            {editing ? 'Cerrar' : 'Editar'}
          </button>
          <button onClick={onRemove} style={{ fontSize: 12, padding: '5px 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-3)' }}>✕</button>
        </div>
      </div>

      {editing && (
        <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: 'Movimiento', key: 'name', type: 'text', placeholder: '' },
            { label: 'Reps', key: 'reps', type: 'text', placeholder: '21' },
            { label: 'Peso kg', key: 'weight_kg', type: 'number', placeholder: '' },
            { label: 'Metros', key: 'distance_m', type: 'number', placeholder: '' },
            { label: 'Cal', key: 'calories', type: 'number', placeholder: '' },
          ].map(field => (
            <div key={field.key}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-3)', marginBottom: 4 }}>{field.label}</label>
              <input
                type={field.type}
                value={(local as any)[field.key]}
                onChange={e => setLocal(p => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={save} style={{ padding: '7px 16px', background: 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
          </div>
        </div>
      )}
    </div>
  )
}
