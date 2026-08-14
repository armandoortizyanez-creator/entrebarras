'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAtletasDeCoach, getGruposDeCoach, getAtletasAsignables, asignarAtletasACoach,
} from '@/lib/queries/backoffice'
import Link from 'next/link'
import { X, UsersRound, Users, Check, Plus, ArrowRightLeft, Mail } from 'lucide-react'

export function CoachPanel({ coachId, coachName, coachRole, onClose }: {
  coachId: string
  coachName: string
  coachRole: string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [gestionando, setGestionando] = useState(false)

  const { data: atletas = [], isLoading } = useQuery({
    queryKey: ['coach-athletes', coachId],
    queryFn: () => getAtletasDeCoach(coachId),
  })

  const { data: grupos = [] } = useQuery({
    queryKey: ['coach-groups', coachId],
    queryFn: () => getGruposDeCoach(coachId),
  })

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
        zIndex: 1000, display: 'flex', justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520, height: '100%',
          background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexShrink: 0,
        }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              {coachName}
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', marginTop: 3 }}>
              {coachRole === 'super_admin' ? 'Administrador' : 'Coach'}
              {` · ${atletas.length} atleta${atletas.length !== 1 ? 's' : ''}`}
              {` · ${grupos.length} equipo${grupos.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              borderRadius: 8, cursor: 'pointer', padding: 6, display: 'flex',
              alignItems: 'center', color: 'var(--color-text-2)', flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>

          {/* Equipos que dirige */}
          <Seccion icono={<UsersRound size={15} />} titulo="Equipos que dirige">
            {grupos.length === 0 ? (
              <Vacio texto="No dirige ningún equipo." />
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {grupos.map(g => (
                  <span
                    key={g.id}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 12.5, fontWeight: 700, padding: '6px 11px', borderRadius: 20,
                      background: 'rgba(99,102,241,0.10)', color: '#6366F1',
                      border: '1px solid rgba(99,102,241,0.22)',
                    }}
                  >
                    <UsersRound size={11} />
                    {g.name}
                    <span style={{ opacity: 0.65, fontWeight: 600 }}>{g.athlete_count}</span>
                  </span>
                ))}
              </div>
            )}
          </Seccion>

          {/* Atletas asignados */}
          <Seccion
            icono={<Users size={15} />}
            titulo="Atletas asignados"
            accion={
              <button
                onClick={() => setGestionando(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 8,
                  background: 'rgba(99,102,241,0.10)', color: '#6366F1',
                  border: '1px solid rgba(99,102,241,0.22)', cursor: 'pointer',
                }}
              >
                <Plus size={12} />
                Gestionar
              </button>
            }
          >
            {isLoading ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Cargando...</p>
            ) : atletas.length === 0 ? (
              <Vacio texto="Aún no tiene atletas asignados." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {atletas.map(a => {
                  const iniciales = `${a.first_name[0]}${(a.last_name ?? '')[0] ?? ''}`.toUpperCase()
                  return (
                    <Link
                      key={a.id}
                      href={`/dashboard/atletas/${a.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 11,
                        padding: '9px 10px', borderRadius: 10, textDecoration: 'none',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800, color: '#fff',
                      }}>
                        {iniciales}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>
                          {a.first_name} {a.last_name ?? ''}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginTop: 2 }}>
                          {a.groups.length === 0 ? (
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20,
                              background: 'var(--color-surface-2)', color: 'var(--color-text-3)',
                              border: '1px solid var(--color-border)',
                            }}>
                              S/E
                            </span>
                          ) : a.groups.map(g => (
                            <span key={g.id} style={{
                              fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20,
                              background: 'rgba(99,102,241,0.10)', color: '#6366F1',
                              border: '1px solid rgba(99,102,241,0.22)',
                            }}>
                              {g.name}
                            </span>
                          ))}
                          {a.email && (
                            <span style={{ fontSize: 11, color: 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {a.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </Seccion>
        </div>
      </div>

      {gestionando && (
        <GestionarAtletasModal
          coachId={coachId}
          coachName={coachName}
          asignadosActuales={atletas.map(a => a.id)}
          onClose={() => setGestionando(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['coach-athletes', coachId] })
            qc.invalidateQueries({ queryKey: ['team'] })
            qc.invalidateQueries({ queryKey: ['athletes'] })
            qc.invalidateQueries({ queryKey: ['athletes-with-groups'] })
            setGestionando(false)
          }}
        />
      )}
    </div>
  )
}

/* ══════════════ MODAL: gestionar atletas del coach ══════════════ */
function GestionarAtletasModal({ coachId, coachName, asignadosActuales, onClose, onSaved }: {
  coachId: string
  coachName: string
  asignadosActuales: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(asignadosActuales))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['athletes-asignables'],
    queryFn: getAtletasAsignables,
  })

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function guardar() {
    setSaving(true)
    setError('')
    try {
      const aSumar = [...selected].filter(id => !asignadosActuales.includes(id))
      const aQuitar = asignadosActuales.filter(id => !selected.has(id))

      if (aSumar.length > 0) await asignarAtletasACoach(coachId, aSumar)
      // Quitar a un atleta de este coach lo deja sin coach, no lo borra.
      if (aQuitar.length > 0) await asignarAtletasACoach(null, aQuitar)

      onSaved()
    } catch (err) {
      const e = err as { message?: string; details?: string } | null
      setError([e?.message, e?.details].filter(Boolean).join(' — ') || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={e => { e.stopPropagation(); onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
        zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)', borderRadius: 18, width: '100%', maxWidth: 480,
          maxHeight: '82vh', display: 'flex', flexDirection: 'column',
          border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
              Atletas de {coachName}
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', marginTop: 2 }}>
              {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', padding: 6, display: 'flex', color: 'var(--color-text-2)' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <p style={{ padding: 28, textAlign: 'center', fontSize: 13.5, color: 'var(--color-text-3)' }}>Cargando atletas...</p>
          ) : todos.length === 0 ? (
            <p style={{ padding: 28, textAlign: 'center', fontSize: 13.5, color: 'var(--color-text-3)' }}>No hay atletas en el box.</p>
          ) : (
            todos.map(a => {
              const checked = selected.has(a.id)
              const iniciales = `${a.first_name[0]}${(a.last_name ?? '')[0] ?? ''}`.toUpperCase()
              return (
                <button
                  key={a.id}
                  onClick={() => toggle(a.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                    padding: '10px 22px', textAlign: 'left', cursor: 'pointer', border: 'none',
                    background: checked ? 'rgba(99,102,241,0.10)' : 'transparent',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <span style={{
                    width: 19, height: 19, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${checked ? '#6366F1' : 'var(--color-text-4)'}`,
                    background: checked ? '#6366F1' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {checked && <Check size={11} color="#fff" strokeWidth={3} />}
                  </span>
                  <span style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11.5, fontWeight: 800, color: '#fff',
                  }}>
                    {iniciales}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>
                      {a.first_name} {a.last_name ?? ''}
                    </span>
                    {a.email && (
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.email}
                      </span>
                    )}
                  </span>
                </button>
              )
            })
          )}
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
          <p style={{ fontSize: 11.5, color: 'var(--color-text-3)', lineHeight: 1.5, marginBottom: 10 }}>
            <ArrowRightLeft size={11} style={{ display: 'inline', verticalAlign: -1, marginRight: 4 }} />
            Desmarcar a un atleta lo deja sin coach, no lo elimina.
          </p>
          {error && <p style={{ fontSize: 12.5, color: '#EF4444', marginBottom: 10 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 13.5, cursor: 'pointer', background: 'transparent', color: 'var(--color-text-2)', fontWeight: 500 }}>
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={saving}
              style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                background: saving ? 'var(--color-surface-2)' : '#6366F1',
                color: saving ? 'var(--color-text-3)' : '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Seccion({ icono, titulo, accion, children }: {
  icono: React.ReactNode; titulo: string; accion?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ color: 'var(--color-text-3)', display: 'flex' }}>{icono}</span>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', flex: 1 }}>{titulo}</h3>
        {accion}
      </div>
      {children}
    </div>
  )
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div style={{
      border: '1.5px dashed var(--color-border)', borderRadius: 12,
      padding: '22px 18px', textAlign: 'center',
    }}>
      <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{texto}</p>
    </div>
  )
}
