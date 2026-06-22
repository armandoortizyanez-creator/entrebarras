'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAthletes, createAthlete, deleteAthlete } from '@/lib/queries/athletes'
import { useUser } from '@/hooks/useUser'
import type { Athlete } from '@entrebarras/types'
import Link from 'next/link'
import { Plus, X, ChevronLeft, ChevronRight, UserRound } from 'lucide-react'

type FilterStatus = 'all' | 'active' | 'inactive' | 'prospect'

const PAGE_SIZE = 12

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante', intermediate: 'Intermedio',
  advanced: 'Avanzado', competitive: 'Competitivo',
}
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: 'Activo',    color: '#16A34A', bg: '#F0FDF4' },
  inactive: { label: 'Inactivo',  color: '#94A3B8', bg: '#F8FAFC' },
  prospect: { label: 'Prospecto', color: '#1D4ED8', bg: '#EFF6FF' },
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
  width: '100%', padding: '8px 11px',
  border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13.5,
  color: '#0F172A', background: '#fff', boxSizing: 'border-box', outline: 'none',
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

  // Reset page when filters change
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
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.04em' }}>
            {coachFilter ? 'Mis atletas' : 'Atletas'}
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>
            {athletes.length} {athletes.length === 1 ? 'atleta registrado' : 'atletas registrados'}
            {coachFilter ? ' asignados a ti' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#E53E3E', color: '#fff', border: 'none',
            borderRadius: 10, padding: isMobile ? '8px 14px' : '9px 18px',
            fontSize: 13.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Plus size={15} />
          {isMobile ? 'Nuevo' : 'Nuevo atleta'}
        </button>
      </div>

      {/* Filters card */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14,
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          padding: '14px 16px', borderBottom: '1px solid #F1F5F9',
          display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 160 }}
          />
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flexShrink: 0 }}>
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                style={{
                  padding: '7px 13px', borderRadius: 8, fontSize: 13,
                  fontWeight: status === tab.value ? 700 : 500,
                  cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
                  background: status === tab.value ? '#E53E3E' : '#F8FAFC',
                  color: status === tab.value ? '#fff' : '#64748B',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Cargando...</div>
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
            padding: '12px 16px', borderTop: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: 8,
                  background: 'transparent', cursor: page === 1 ? 'not-allowed' : 'pointer',
                  color: page === 1 ? '#CBD5E1' : '#475569', display: 'flex', alignItems: 'center',
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
                    borderColor: p === page ? '#E53E3E' : '#E2E8F0',
                    background: p === page ? '#E53E3E' : 'transparent',
                    color: p === page ? '#fff' : '#64748B',
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: 8,
                  background: 'transparent', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  color: page === totalPages ? '#CBD5E1' : '#475569', display: 'flex', alignItems: 'center',
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

/* ═══════════════ DESKTOP TABLE ═══════════════ */
function AthleteTable({ athletes, onDelete }: { athletes: Athlete[]; onDelete: (id: string) => void }) {
  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 160px 110px 110px 48px',
        padding: '10px 20px', borderBottom: '1px solid #F1F5F9',
        fontSize: 10, fontWeight: 700, color: '#94A3B8',
        textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>
        <span>Atleta</span>
        <span>Deporte</span>
        <span>Nivel</span>
        <span>Estado</span>
        <span></span>
      </div>

      {athletes.map((athlete, i) => {
        const initials = `${athlete.first_name[0]}${(athlete.last_name ?? '')[0] ?? ''}`.toUpperCase()
        const st = STATUS_MAP[athlete.status ?? 'active'] ?? STATUS_MAP.active
        return (
          <div
            key={athlete.id}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 160px 110px 110px 48px',
              padding: '13px 20px', alignItems: 'center',
              borderBottom: i < athletes.length - 1 ? '1px solid #F8FAFC' : 'none',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Link href={`/dashboard/atletas/${athlete.id}`} style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #E53E3E 0%, #B91C1C 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
              }}>
                {initials}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
                  {athlete.first_name} {athlete.last_name}
                </p>
                {athlete.email && (
                  <p style={{ fontSize: 12, color: '#94A3B8' }}>{athlete.email}</p>
                )}
              </div>
            </Link>

            <span style={{ fontSize: 13, color: '#64748B' }}>
              {athlete.primary_sport ?? 'No definido'}
            </span>

            <span style={{ fontSize: 13, color: '#64748B' }}>
              {LEVEL_LABELS[athlete.sport_level ?? ''] ?? 'No definido'}
            </span>

            <span style={{
              display: 'inline-block', fontSize: 12, fontWeight: 600,
              padding: '3px 10px', borderRadius: 20,
              color: st.color, background: st.bg,
            }}>
              {st.label}
            </span>

            <button
              onClick={() => onDelete(athlete.id)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#CBD5E1', padding: 4, display: 'flex', alignItems: 'center',
                transition: 'color 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
              onMouseLeave={e => (e.currentTarget.style.color = '#CBD5E1')}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════ MOBILE CARDS ═══════════════ */
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
              borderBottom: i < athletes.length - 1 ? '1px solid #F8FAFC' : 'none',
            }}
          >
            <Link href={`/dashboard/atletas/${athlete.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, textDecoration: 'none', minWidth: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #E53E3E 0%, #B91C1C 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: '#fff',
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>
                  {athlete.first_name} {athlete.last_name}
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {athlete.email && (
                    <p style={{ fontSize: 12, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{athlete.email}</p>
                  )}
                </div>
              </div>
            </Link>

            <span style={{
              fontSize: 11.5, fontWeight: 600, padding: '4px 10px',
              borderRadius: 20, color: st.color, background: st.bg,
              flexShrink: 0,
            }}>
              {st.label}
            </span>

            <button
              onClick={() => onDelete(athlete.id)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 4, display: 'flex', alignItems: 'center' }}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════ EMPTY STATE ═══════════════ */
function EmptyState({ onAdd, hasSearch }: { onAdd: () => void; hasSearch: boolean }) {
  return (
    <div style={{ padding: '56px 24px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UserRound size={22} color="#CBD5E1" />
        </div>
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
        {hasSearch ? 'Sin resultados' : 'Aún no hay atletas'}
      </h3>
      <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 22 }}>
        {hasSearch ? 'Intenta con otro nombre o email.' : 'Comienza agregando tu primer atleta.'}
      </p>
      {!hasSearch && (
        <button onClick={onAdd} style={{ background: '#E53E3E', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 22px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
          Agregar atleta
        </button>
      )}
    </div>
  )
}

/* ═══════════════ NEW ATHLETE MODAL ═══════════════ */
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

  const fields: { label: string; key: keyof typeof form; type?: string; required?: boolean }[] = [
    { label: 'Nombre', key: 'first_name', required: true },
    { label: 'Apellido', key: 'last_name', required: true },
    { label: 'Email', key: 'email', type: 'email' },
    { label: 'Teléfono', key: 'phone' },
    { label: 'Deporte principal', key: 'primary_sport' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Nuevo atleta</h2>
          <button onClick={onClose} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', color: '#64748B' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {fields.slice(0, 2).map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                  {f.label}{f.required && ' *'}
                </label>
                <input type={f.type ?? 'text'} required={f.required} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
          </div>

          {fields.slice(2).map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                {f.label}
              </label>
              <input type={f.type ?? 'text'} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inputStyle} />
            </div>
          ))}

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Nivel</label>
            <select value={form.sport_level} onChange={e => setForm(p => ({ ...p, sport_level: e.target.value }))} style={{ ...inputStyle, appearance: 'none' as const }}>
              <option value="">Sin definir</option>
              {Object.entries(LEVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: '#EF4444', background: '#FFF5F5', border: '1px solid #FEE2E2', padding: '8px 12px', borderRadius: 8 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13.5, cursor: 'pointer', background: 'transparent', color: '#64748B', fontWeight: 500 }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', background: loading ? '#F1F5F9' : '#E53E3E', color: loading ? '#94A3B8' : '#fff', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Guardando...' : 'Guardar atleta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
