'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAthletes, createAthlete, deleteAthlete } from '@/lib/queries/athletes'
import { useUser } from '@/hooks/useUser'
import type { Athlete } from '@entrebarras/types'
import Link from 'next/link'
import { Plus, X, ChevronLeft, ChevronRight, UserRound, Search } from 'lucide-react'

const ACCENT = '#6366F1'
const VIOLET = '#7C3AED'

type FilterStatus = 'all' | 'active' | 'inactive' | 'prospect'

const PAGE_SIZE = 12

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante', intermediate: 'Intermedio',
  advanced: 'Avanzado', competitive: 'Competitivo',
}
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: 'Activo',    color: '#4ADE80', bg: 'rgba(74,222,128,0.12)' },
  inactive: { label: 'Inactivo',  color: 'var(--color-text-3)', bg: 'var(--color-surface-2)' },
  prospect: { label: 'Prospecto', color: '#818CF8', bg: 'rgba(129,140,248,0.12)' },
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px 8px 36px',
  border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13.5,
  color: 'var(--color-text)', background: 'var(--color-bg)',
  boxSizing: 'border-box', outline: 'none',
}

export function AthletesView() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<FilterStatus>('all')
  const [showModal, setShowModal] = useState(false)
  const [page, setPage] = useState(1)
  const isMobile = useIsMobile()

  const { user, isCoach, isSuperAdmin, isPlatformAdmin } = useUser()
  const qc = useQueryClient()

  const coachFilter = isCoach && !isSuperAdmin && !isPlatformAdmin ? user?.id : undefined

  const { data: athletes = [], isLoading } = useQuery({
    queryKey: ['athletes', status, coachFilter],
    queryFn: () => getAthletes({ status: status === 'all' ? undefined : status, coach_id: coachFilter }),
    enabled: !!user,
  })

  const filtered = athletes.filter(a =>
    search === '' ||
    `${a.first_name} ${a.last_name ?? ''}`.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, status])

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
    <div style={{ padding: isMobile ? '20px 16px' : '32px 36px', maxWidth: 1100 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.04em' }}>
            {coachFilter ? 'Mis atletas' : 'Atletas'}
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-2)', marginTop: 4 }}>
            {athletes.length} {athletes.length === 1 ? 'atleta registrado' : 'atletas registrados'}
            {coachFilter ? ' asignados a ti' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`,
            color: '#fff', border: 'none',
            borderRadius: 10, padding: isMobile ? '8px 14px' : '9px 18px',
            fontSize: 13.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.transform = 'translateY(-2px)'
            el.style.boxShadow = '0 8px 24px rgba(99,102,241,0.50)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.transform = 'translateY(0)'
            el.style.boxShadow = '0 4px 14px rgba(99,102,241,0.35)'
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          {isMobile ? 'Nuevo' : 'Nuevo atleta'}
        </button>
      </div>

      {/* ── Table card ── */}
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16,
        overflow: 'hidden', boxShadow: 'var(--shadow-card)',
      }}>
        {/* Filters bar */}
        <div style={{
          padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
        }}>
          {/* Search input with icon */}
          <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Status tabs */}
          <div style={{ display: 'flex', gap: 3, overflowX: 'auto', flexShrink: 0, background: 'var(--color-bg)', borderRadius: 10, padding: 3 }}>
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                style={{
                  padding: '6px 13px', borderRadius: 8, fontSize: 12.5,
                  fontWeight: status === tab.value ? 700 : 500,
                  cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
                  background: status === tab.value ? ACCENT : 'transparent',
                  color: status === tab.value ? '#fff' : 'var(--color-text-2)',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState onAdd={() => setShowModal(true)} hasSearch={search.length > 0} />
        ) : isMobile ? (
          <AthleteCards athletes={paginated} onDelete={id => { if (confirm('¿Eliminar este atleta?')) deleteMutation.mutate(id) }} />
        ) : (
          <AthleteTable athletes={paginated} onDelete={id => { if (confirm('¿Eliminar este atleta?')) deleteMutation.mutate(id) }} />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: '12px 16px', borderTop: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 5 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 8,
                  background: 'transparent', cursor: page === 1 ? 'not-allowed' : 'pointer',
                  color: page === 1 ? 'var(--color-text-4)' : 'var(--color-text-2)', display: 'flex', alignItems: 'center',
                }}
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: '6px 11px', border: '1px solid', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    borderColor: p === page ? ACCENT : 'var(--color-border)',
                    background: p === page ? ACCENT : 'transparent',
                    color: p === page ? '#fff' : 'var(--color-text-2)',
                    transition: 'background 0.1s, color 0.1s',
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 8,
                  background: 'transparent', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  color: page === totalPages ? 'var(--color-text-4)' : 'var(--color-text-2)', display: 'flex', alignItems: 'center',
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
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

/* ─── DESKTOP TABLE ─── */
function AthleteTable({ athletes, onDelete }: { athletes: Athlete[]; onDelete: (id: string) => void }) {
  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 160px 110px 110px 48px',
        padding: '10px 20px', borderBottom: '1px solid var(--color-border)',
        fontSize: 10, fontWeight: 700, color: 'var(--color-text-3)',
        textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        <span>Atleta</span>
        <span>Deporte</span>
        <span>Nivel</span>
        <span>Estado</span>
        <span />
      </div>

      {athletes.map((athlete, i) => {
        const initials = `${athlete.first_name[0]}${(athlete.last_name ?? '')[0] ?? ''}`.toUpperCase()
        const st = STATUS_MAP[athlete.status ?? 'active'] ?? STATUS_MAP.active
        return (
          <div
            key={athlete.id}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 160px 110px 110px 48px',
              padding: '12px 20px', alignItems: 'center',
              borderBottom: i < athletes.length - 1 ? '1px solid var(--color-border)' : 'none',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Link href={`/dashboard/atletas/${athlete.id}`} style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: `linear-gradient(135deg, ${ACCENT} 0%, ${VIOLET} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
              }}>
                {initials}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                  {athlete.first_name} {athlete.last_name}
                </p>
                {athlete.email && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{athlete.email}</p>
                )}
              </div>
            </Link>

            <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
              {athlete.primary_sport ?? '—'}
            </span>

            <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
              {LEVEL_LABELS[athlete.sport_level ?? ''] ?? '—'}
            </span>

            <span style={{
              display: 'inline-block', fontSize: 11.5, fontWeight: 700,
              padding: '3px 10px', borderRadius: 20,
              color: st.color, background: st.bg,
            }}>
              {st.label}
            </span>

            <button
              onClick={() => onDelete(athlete.id)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-4)', padding: 4, display: 'flex', alignItems: 'center',
                transition: 'color 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-4)')}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

/* ─── MOBILE CARDS ─── */
function AthleteCards({ athletes, onDelete }: { athletes: Athlete[]; onDelete: (id: string) => void }) {
  return (
    <div>
      {athletes.map((athlete, i) => {
        const initials = `${athlete.first_name[0]}${(athlete.last_name ?? '')[0] ?? ''}`.toUpperCase()
        const st = STATUS_MAP[athlete.status ?? 'active'] ?? STATUS_MAP.active
        return (
          <div
            key={athlete.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
              borderBottom: i < athletes.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            <Link href={`/dashboard/atletas/${athlete.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, textDecoration: 'none', minWidth: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${ACCENT} 0%, ${VIOLET} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: '#fff',
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
                  {athlete.first_name} {athlete.last_name}
                </p>
                {athlete.email && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{athlete.email}</p>
                )}
              </div>
            </Link>

            <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 20, color: st.color, background: st.bg, flexShrink: 0 }}>
              {st.label}
            </span>

            <button
              onClick={() => onDelete(athlete.id)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-4)', padding: 4, display: 'flex', alignItems: 'center' }}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

/* ─── SKELETON ─── */
function TableSkeleton() {
  return (
    <div>
      {[0, 1, 2, 3, 4].map(i => (
        <div
          key={i}
          style={{
            display: 'grid', gridTemplateColumns: '1fr 160px 110px 110px 48px',
            padding: '14px 20px', alignItems: 'center',
            borderBottom: i < 4 ? '1px solid var(--color-border)' : 'none',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="skeleton" style={{ height: 12, width: 120 }} />
              <div className="skeleton" style={{ height: 10, width: 80 }} />
            </div>
          </div>
          <div className="skeleton" style={{ height: 12, width: 80 }} />
          <div className="skeleton" style={{ height: 12, width: 70 }} />
          <div className="skeleton" style={{ height: 22, width: 65, borderRadius: 999 }} />
          <div />
        </div>
      ))}
    </div>
  )
}

/* ─── EMPTY STATE ─── */
function EmptyState({ onAdd, hasSearch }: { onAdd: () => void; hasSearch: boolean }) {
  return (
    <div style={{ padding: '56px 24px', textAlign: 'center' }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
        <UserRound size={24} color={ACCENT} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8, letterSpacing: '-0.02em' }}>
        {hasSearch ? 'Sin resultados' : 'Aún no hay atletas'}
      </h3>
      <p style={{ fontSize: 13.5, color: 'var(--color-text-3)', marginBottom: 22, maxWidth: 280, margin: '0 auto 22px', lineHeight: 1.6 }}>
        {hasSearch ? 'Intenta con otro nombre o email.' : 'Comienza agregando tu primer atleta al box.'}
      </p>
      {!hasSearch && (
        <button
          onClick={onAdd}
          style={{
            background: `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`,
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '9px 22px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
          }}
        >
          Agregar atleta
        </button>
      )}
    </div>
  )
}

/* ─── NEW ATHLETE MODAL ─── */
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

  const baseInput: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    border: '1px solid var(--color-border)', borderRadius: 9, fontSize: 13.5,
    color: 'var(--color-text)', background: 'var(--color-bg)',
    boxSizing: 'border-box', outline: 'none',
    transition: 'border-color 0.15s',
  }

  const fields: { label: string; key: keyof typeof form; type?: string; required?: boolean }[] = [
    { label: 'Nombre', key: 'first_name', required: true },
    { label: 'Apellido', key: 'last_name', required: true },
    { label: 'Email', key: 'email', type: 'email' },
    { label: 'Teléfono', key: 'phone' },
    { label: 'Deporte principal', key: 'primary_sport' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,11,16,0.70)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.40)', border: '1px solid var(--color-border)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Nuevo atleta</h2>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', marginTop: 2 }}>Completa la información básica</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', color: 'var(--color-text-2)' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {fields.slice(0, 2).map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                  {f.label}{f.required && <span style={{ color: ACCENT }}> *</span>}
                </label>
                <input type={f.type ?? 'text'} required={f.required} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={baseInput} />
              </div>
            ))}
          </div>

          {fields.slice(2).map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                {f.label}
              </label>
              <input type={f.type ?? 'text'} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={baseInput} />
            </div>
          ))}

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Nivel</label>
            <select
              value={form.sport_level}
              onChange={e => setForm(p => ({ ...p, sport_level: e.target.value }))}
              style={{ ...baseInput, appearance: 'none' as const }}
            >
              <option value="">Sin definir</option>
              {Object.entries(LEVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: '#F87171', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', padding: '9px 12px', borderRadius: 9 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '10px', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 13.5, cursor: 'pointer', background: 'transparent', color: 'var(--color-text-2)', fontWeight: 500 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: '10px',
                background: loading ? 'var(--color-surface-2)' : `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`,
                color: loading ? 'var(--color-text-3)' : '#fff',
                border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(99,102,241,0.35)',
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
