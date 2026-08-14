'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCoachOptions, getGruposDeAtleta, setGruposDeAtleta, asignarAtletasACoach,
} from '@/lib/queries/backoffice'
import { getGroups } from '@/lib/queries/team'
import { useUser } from '@/hooks/useUser'
import { UserCog, UsersRound, Check, Loader2 } from 'lucide-react'

export function AthleteAssignmentCard({ athleteId, coachActual }: {
  athleteId: string
  coachActual: string | null
}) {
  const { canManageUsers, isCoach } = useUser()
  const qc = useQueryClient()
  const [estado, setEstado] = useState<'idle' | 'guardando' | 'guardado' | 'error'>('idle')
  const [error, setError] = useState('')

  const { data: coaches = [] } = useQuery({ queryKey: ['coach-options'], queryFn: getCoachOptions })
  const { data: grupos = [] } = useQuery({ queryKey: ['groups'], queryFn: getGroups })
  const { data: gruposDelAtleta = [], isLoading } = useQuery({
    queryKey: ['athlete-groups', athleteId],
    queryFn: () => getGruposDeAtleta(athleteId),
  })

  const [seleccion, setSeleccion] = useState<string[]>([])
  useEffect(() => { setSeleccion(gruposDelAtleta) }, [gruposDelAtleta])

  function invalidar() {
    qc.invalidateQueries({ queryKey: ['athlete-groups', athleteId] })
    qc.invalidateQueries({ queryKey: ['athletes-with-groups'] })
    qc.invalidateQueries({ queryKey: ['athlete', athleteId] })
    qc.invalidateQueries({ queryKey: ['team'] })
  }

  const cambiarCoach = useMutation({
    mutationFn: (coachId: string) => asignarAtletasACoach(coachId || null, [athleteId]),
    onMutate: () => { setEstado('guardando'); setError('') },
    onSuccess: () => { setEstado('guardado'); invalidar() },
    onError: (e: unknown) => {
      setEstado('error')
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el coach')
    },
  })

  const cambiarGrupos = useMutation({
    mutationFn: (ids: string[]) => setGruposDeAtleta(athleteId, ids),
    onMutate: () => { setEstado('guardando'); setError('') },
    onSuccess: () => { setEstado('guardado'); invalidar() },
    onError: (e: unknown) => {
      setEstado('error')
      const err = e as { message?: string; details?: string } | null
      setError([err?.message, err?.details].filter(Boolean).join(' — ') || 'No se pudieron guardar los equipos')
    },
  })

  // Solo el staff gestiona asignaciones.
  if (!isCoach) return null

  function alternarGrupo(id: string) {
    const siguiente = seleccion.includes(id)
      ? seleccion.filter(x => x !== id)
      : [...seleccion, id]
    setSeleccion(siguiente)
    cambiarGrupos.mutate(siguiente)
  }

  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 16, padding: '18px 20px', marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <UserCog size={15} color="var(--color-text-3)" />
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', flex: 1 }}>
          Coach y equipos
        </h3>
        <IndicadorGuardado estado={estado} />
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {/* Coach */}
        <div>
          <label style={etiqueta}>Coach a cargo</label>
          {canManageUsers ? (
            <select
              value={coachActual ?? ''}
              onChange={e => cambiarCoach.mutate(e.target.value)}
              style={{
                width: '100%', padding: '9px 11px', borderRadius: 9,
                border: '1px solid var(--color-border)', fontSize: 13.5,
                color: 'var(--color-text)', background: 'var(--color-surface)',
                outline: 'none', cursor: 'pointer', boxSizing: 'border-box',
              }}
            >
              <option value="">Sin coach asignado</option>
              {coaches.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.role === 'super_admin' ? ' (Administrador)' : ''}
                </option>
              ))}
            </select>
          ) : (
            <p style={{ fontSize: 13.5, color: 'var(--color-text-2)' }}>
              {coaches.find(c => c.id === coachActual)?.name ?? 'Sin coach asignado'}
              <span style={{ fontSize: 11.5, color: 'var(--color-text-3)', marginLeft: 8 }}>
                (solo un administrador puede cambiarlo)
              </span>
            </p>
          )}
        </div>

        {/* Equipos */}
        <div>
          <label style={etiqueta}>Equipos</label>
          {isLoading ? (
            <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>Cargando...</p>
          ) : grupos.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-text-3)' }}>
              Aún no hay equipos creados en el box.
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {grupos.map((g: { id: string; name: string }) => {
                const activo = seleccion.includes(g.id)
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => alternarGrupo(g.id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 11px', borderRadius: 20, cursor: 'pointer',
                      fontSize: 12, fontWeight: 700,
                      background: activo ? 'rgba(99,102,241,0.12)' : 'transparent',
                      border: `1px solid ${activo ? '#6366F1' : 'var(--color-border)'}`,
                      color: activo ? '#6366F1' : 'var(--color-text-2)',
                      transition: 'all 0.12s',
                    }}
                  >
                    <span style={{
                      width: 13, height: 13, borderRadius: 4, flexShrink: 0,
                      border: `2px solid ${activo ? '#6366F1' : 'var(--color-text-4)'}`,
                      background: activo ? '#6366F1' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {activo && <Check size={8} color="#fff" strokeWidth={4} />}
                    </span>
                    <UsersRound size={11} />
                    {g.name}
                  </button>
                )
              })}
            </div>
          )}
          {seleccion.length === 0 && !isLoading && grupos.length > 0 && (
            <p style={{ fontSize: 11.5, color: 'var(--color-text-3)', marginTop: 8 }}>
              Sin equipo. Aparecerá como <strong>S/E</strong> en los listados.
            </p>
          )}
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 12.5, color: '#EF4444', marginTop: 12, lineHeight: 1.5 }}>{error}</p>
      )}
    </div>
  )
}

function IndicadorGuardado({ estado }: { estado: 'idle' | 'guardando' | 'guardado' | 'error' }) {
  if (estado === 'idle') return null
  const mapa = {
    guardando: { icono: <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />, texto: 'Guardando', color: 'var(--color-text-3)' },
    guardado:  { icono: <Check size={11} />, texto: 'Guardado', color: '#22C55E' },
    error:     { icono: null, texto: 'Error', color: '#EF4444' },
  }[estado]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: mapa.color }}>
      {mapa.icono}
      {mapa.texto}
    </span>
  )
}

const etiqueta: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7,
}
