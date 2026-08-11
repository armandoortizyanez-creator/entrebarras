'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRoutine, addBlock, deleteBlock, updateBlock,
  assignRoutineToAthletes, getRoutineAssignments,
  type RoutineBlockFull,
} from '@/lib/queries/routines'
import { getAthletes } from '@/lib/queries/athletes'
import { isSafeUrl, normalizeLinks, BlockLinkList, type BlockLink } from '@/components/routines/BlockContent'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Users, X, Check, Loader2, Link2, Play } from 'lucide-react'

const BLOCK_TYPES = [
  { value: 'warmup',    label: 'Calentamiento' },
  { value: 'strength',  label: 'Fuerza' },
  { value: 'wod',       label: 'WOD' },
  { value: 'emom',      label: 'EMOM / Intervalos' },
  { value: 'superset',  label: 'Superserie' },
  { value: 'circuit',   label: 'Circuito' },
  { value: 'accessory', label: 'Accesorio' },
  { value: 'cooldown',  label: 'Vuelta a la calma' },
  { value: 'standard',  label: 'General' },
]

const BLOCK_COLORS: Record<string, string> = {
  warmup: '#F59E0B', strength: '#3B82F6', wod: '#F43F5E', emom: '#8B5CF6',
  superset: '#10B981', circuit: '#F97316', accessory: '#22C55E',
  cooldown: '#0EA5E9', standard: '#64748B',
}

const PLACEHOLDER = `4 SET 55-65%
2 HANG POWER CLEAN
1 PUSH JERK
1 SPLIT JERK

3 SET 70-80%
1 HANG CLEAN
1 FRONT SQUAT

Pega aquí tu rutina desde Excel o escríbela directo.
Si incluyes un link de video queda clicable automáticamente.`

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px',
  border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13.5,
  color: 'var(--color-text)', background: 'var(--color-surface)',
  boxSizing: 'border-box', outline: 'none',
}

export function RoutineBuilder({ routineId }: { routineId: string }) {
  const qc = useQueryClient()
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
    mutationFn: () => addBlock(routineId, routine?.blocks.length ?? 0, 'standard'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routine', routineId] }),
  })

  const deleteBlockMutation = useMutation({
    mutationFn: deleteBlock,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routine', routineId] }),
  })

  /** Guardado silencioso: no invalida la query, para no interrumpir la escritura. */
  const saveBlock = useCallback(
    (blockId: string, data: Parameters<typeof updateBlock>[1]) => updateBlock(blockId, data),
    []
  )

  /** Cambios estructurales sí refrescan (el color y la etiqueta dependen del tipo). */
  const saveBlockAndRefresh = useCallback(
    (blockId: string, data: Parameters<typeof updateBlock>[1]) =>
      updateBlock(blockId, data).then(() =>
        qc.invalidateQueries({ queryKey: ['routine', routineId] })
      ),
    [qc, routineId]
  )

  if (isLoading) return <SkeletonLoader />
  if (!routine) return <div style={{ padding: 48, color: '#EF4444', fontSize: 14 }}>Rutina no encontrada</div>

  return (
    <div style={{ padding: '36px 40px', maxWidth: 820 }}>
      <Link href="/dashboard/rutinas" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: 'var(--color-text-2)', textDecoration: 'none',
        fontWeight: 500, marginBottom: 24,
      }}>
        <ArrowLeft size={15} />
        Volver a Rutinas
      </Link>

      {/* Header */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16,
        padding: '20px 24px', marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.04em', marginBottom: 4 }}>
            {routine.name}
          </h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {routine.description && (
              <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{routine.description}</span>
            )}
            <MetaChip label={`${routine.blocks.length} bloque${routine.blocks.length !== 1 ? 's' : ''}`} />
            {(assignments as string[]).length > 0 && (
              <MetaChip label={`${(assignments as string[]).length} atletas`} icon={<Users size={11} />} />
            )}
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
        {routine.blocks.map((block, i) => (
          <BlockCard
            key={block.id}
            block={block}
            blockNumber={i + 1}
            onSave={data => saveBlock(block.id, data)}
            onSaveAndRefresh={data => saveBlockAndRefresh(block.id, data)}
            onDelete={() => {
              if (confirm(`¿Eliminar el bloque ${block.name || i + 1}?`)) {
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

/* ══════════════════ BLOCK CARD ══════════════════ */

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function BlockCard({ block, blockNumber, onSave, onSaveAndRefresh, onDelete }: {
  block: RoutineBlockFull
  blockNumber: number
  onSave: (data: Parameters<typeof updateBlock>[1]) => Promise<void>
  onSaveAndRefresh: (data: Parameters<typeof updateBlock>[1]) => Promise<unknown>
  onDelete: () => void
}) {
  const [name, setName] = useState(block.name ?? '')
  const [content, setContent] = useState(block.content ?? '')
  const [links, setLinks] = useState<BlockLink[]>(() => normalizeLinks(block.links))
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [showLinkForm, setShowLinkForm] = useState(false)

  const accent = BLOCK_COLORS[block.type] ?? BLOCK_COLORS.standard
  const taRef = useRef<HTMLTextAreaElement>(null)
  const dirty = useRef(false)
  // Espejo de los valores actuales para poder guardar desde blur/unmount
  // sin re-crear el efecto en cada tecla.
  const latest = useRef({ name, content })
  latest.current = { name, content }

  // Auto-alto del textarea
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.max(ta.scrollHeight, 120)}px`
  }, [content])

  const flush = useCallback(() => {
    if (!dirty.current) return
    dirty.current = false
    setStatus('saving')
    onSave({ name: latest.current.name.trim() || null, content: latest.current.content })
      .then(() => setStatus('saved'))
      .catch(() => setStatus('error'))
  }, [onSave])

  // Auto-guardado con debounce mientras escribe
  useEffect(() => {
    if (!dirty.current) return
    setStatus('saving')
    const t = setTimeout(flush, 800)
    return () => clearTimeout(t)
  }, [name, content, flush])

  // Si desmonta con cambios pendientes (navegar, eliminar otro bloque), guarda igual
  useEffect(() => () => { if (dirty.current) flush() }, [flush])

  function persistLinks(next: BlockLink[]) {
    setLinks(next)
    setStatus('saving')
    onSave({ links: next })
      .then(() => setStatus('saved'))
      .catch(() => setStatus('error'))
  }

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderLeft: `4px solid ${accent}`, borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
    }}>
      {/* Header */}
      <div style={{
        padding: '11px 16px', borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: accent, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, flexShrink: 0,
        }}>
          {blockNumber}
        </div>

        <input
          value={name}
          onChange={e => { dirty.current = true; setName(e.target.value) }}
          placeholder="Nombre del bloque (ej. CONDITION, WOD, FUERZA)"
          style={{
            flex: 1, minWidth: 140, padding: '6px 9px',
            border: '1px solid transparent', borderRadius: 7,
            fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em',
            color: 'var(--color-text)',
            background: 'transparent', outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-surface-2)' }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'transparent'
            e.currentTarget.style.background = 'transparent'
            flush()
          }}
        />

        <SaveIndicator status={status} />

        <select
          value={block.type}
          onChange={e => { setStatus('saving'); onSaveAndRefresh({ type: e.target.value }).then(() => setStatus('saved')) }}
          style={{
            padding: '5px 8px', border: `1px solid ${accent}44`, borderRadius: 7,
            fontSize: 11.5, fontWeight: 700, color: accent, background: `${accent}14`,
            cursor: 'pointer', outline: 'none', flexShrink: 0,
          }}
        >
          {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <button
          onClick={onDelete}
          aria-label="Eliminar bloque"
          style={{
            padding: '5px 7px', border: '1px solid var(--color-border)', borderRadius: 7,
            cursor: 'pointer', background: 'transparent', color: 'var(--color-text-4)',
            display: 'flex', alignItems: 'center', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FEE2E2' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-4)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Cuaderno */}
      <textarea
        ref={taRef}
        value={content}
        onChange={e => { dirty.current = true; setContent(e.target.value) }}
        onBlur={flush}
        placeholder={PLACEHOLDER}
        spellCheck={false}
        style={{
          width: '100%', minHeight: 120, padding: '14px 18px',
          border: 'none', outline: 'none', resize: 'none',
          background: 'transparent', color: 'var(--color-text)',
          fontSize: 14, lineHeight: 1.65, fontFamily: 'inherit',
          boxSizing: 'border-box', display: 'block',
          fontVariantNumeric: 'tabular-nums',
        }}
      />

      {/* Referencias */}
      <div style={{ padding: '0 18px 14px' }}>
        {links.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
            {links.map((l, i) => (
              <span
                key={`${i}-${l.url}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12.5, fontWeight: 600, color: '#6366F1',
                  background: 'rgba(99,102,241,0.09)', border: '1px solid rgba(99,102,241,0.22)',
                  borderRadius: 20, padding: '5px 8px 5px 11px', maxWidth: '100%',
                }}
              >
                <Play size={11} style={{ flexShrink: 0 }} />
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  style={{ color: 'inherit', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {l.label}
                </a>
                <button
                  onClick={() => persistLinks(links.filter((_, j) => j !== i))}
                  aria-label={`Quitar ${l.label}`}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: '#6366F1', display: 'flex', alignItems: 'center', padding: 2, opacity: 0.65,
                  }}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        {showLinkForm ? (
          <LinkForm
            onCancel={() => setShowLinkForm(false)}
            onAdd={l => { persistLinks([...links, l]); setShowLinkForm(false) }}
          />
        ) : (
          <button
            onClick={() => setShowLinkForm(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 12.5, color: 'var(--color-text-2)', background: 'transparent',
              border: '1px solid var(--color-border)', borderRadius: 8,
              padding: '5px 11px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            <Link2 size={12} />
            Agregar video de referencia
          </button>
        )}
      </div>
    </div>
  )
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  const map = {
    saving: { icon: <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />, text: 'Guardando', color: 'var(--color-text-3)' },
    saved:  { icon: <Check size={11} />,  text: 'Guardado', color: '#22C55E' },
    error:  { icon: <X size={11} />,      text: 'Error al guardar', color: '#EF4444' },
  }[status]

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600, color: map.color, flexShrink: 0,
    }}>
      {map.icon}
      {map.text}
    </span>
  )
}

function LinkForm({ onAdd, onCancel }: { onAdd: (l: BlockLink) => void; onCancel: () => void }) {
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  function submit() {
    const clean = url.trim()
    if (!clean) return setError('Pega la URL del video')
    const withProto = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`
    if (!isSafeUrl(withProto)) return setError('Esa URL no es válida')
    onAdd({ label: label.trim() || new URL(withProto).hostname.replace(/^www\./, ''), url: withProto })
  }

  return (
    <div style={{
      background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
      borderRadius: 10, padding: 12,
    }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <input
          autoFocus
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Nombre (ej. Técnica de snatch)"
          style={{ ...inputStyle, flex: '1 1 180px' }}
        />
        <input
          value={url}
          onChange={e => { setUrl(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="https://youtube.com/..."
          style={{ ...inputStyle, flex: '1 1 200px' }}
        />
      </div>
      {error && <p style={{ fontSize: 12, color: '#EF4444', marginBottom: 8 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={submit}
          style={{ padding: '7px 16px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
        >
          Agregar
        </button>
        <button
          onClick={onCancel}
          style={{ padding: '7px 14px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12.5, color: 'var(--color-text-2)', cursor: 'pointer' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

/* ══════════════════ ASSIGN MODAL ══════════════════ */
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
                  <div style={{
                    width: 20, height: 20, borderRadius: 6,
                    border: `2px solid ${checked ? '#6366F1' : 'var(--color-text-4)'}`,
                    background: checked ? '#6366F1' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.12s',
                  }}>
                    {checked && <Check size={12} color="#fff" strokeWidth={3} />}
                  </div>
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

function SkeletonLoader() {
  return (
    <div style={{ padding: '36px 40px', maxWidth: 820 }}>
      <div style={{ height: 20, width: 120, background: 'var(--color-surface-2)', borderRadius: 6, marginBottom: 24 }} />
      <div style={{ height: 72, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, marginBottom: 20 }} />
      {[...Array(2)].map((_, i) => (
        <div key={i} style={{ height: 200, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, marginBottom: 14 }} />
      ))}
    </div>
  )
}
