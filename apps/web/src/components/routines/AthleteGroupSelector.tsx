'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAthletesWithGroups, type AthleteGroupRef } from '@/lib/queries/athletes'
import { Users, UsersRound, Check, Minus } from 'lucide-react'

/** Etiqueta para atletas que no pertenecen a ningún grupo. */
export const SIN_EQUIPO = 'S/E'
export const BUCKET_SIN_EQUIPO = '__sin_equipo__'

export interface GrupoDerivado {
  id: string
  name: string
  members: string[]
}

/**
 * Selector compartido de atletas y equipos. Se usa desde Rutinas, Calendario y
 * cualquier otro lugar que asigne trabajo, para que la experiencia sea la misma
 * en todas partes: chips de equipo arriba, atletas individuales abajo, y la
 * etiqueta del equipo (o S/E) junto a cada nombre.
 */
export function AthleteGroupSelector({ selected, onChange, alreadyAssigned = [] }: {
  selected: Set<string>
  onChange: (siguiente: Set<string>) => void
  /** Ids ya asignados, para marcarlos visualmente. */
  alreadyAssigned?: string[]
}) {
  const { data: athletes = [], isLoading } = useQuery({
    queryKey: ['athletes-with-groups'],
    queryFn: getAthletesWithGroups,
  })

  const groups = useMemo(() => derivarGrupos(athletes), [athletes])

  function toggle(id: string) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    onChange(next)
  }

  function groupState(members: string[]): 'none' | 'some' | 'all' {
    const n = members.filter(id => selected.has(id)).length
    if (n === 0) return 'none'
    return n === members.length ? 'all' : 'some'
  }

  function toggleGroup(members: string[]) {
    const completo = groupState(members) === 'all'
    const next = new Set(selected)
    for (const id of members) completo ? next.delete(id) : next.add(id)
    onChange(next)
  }

  if (isLoading) {
    return <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-3)', fontSize: 14 }}>Cargando atletas...</div>
  }
  if (athletes.length === 0) {
    return <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-3)', fontSize: 14 }}>No hay atletas activos</div>
  }

  return (
    <>
      {groups.length > 0 && (
        <>
          <SectionLabel text="A quién · equipo completo" />
          <div style={{ padding: '0 22px 12px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {groups.map(g => {
              const estado = groupState(g.members)
              const activo = estado !== 'none'
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGroup(g.members)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '7px 12px', borderRadius: 20, cursor: 'pointer',
                    fontSize: 12.5, fontWeight: 700,
                    background: activo ? 'rgba(99,102,241,0.12)' : 'transparent',
                    border: `1px solid ${activo ? '#6366F1' : 'var(--color-border)'}`,
                    color: activo ? '#6366F1' : 'var(--color-text-2)',
                    transition: 'all 0.12s',
                  }}
                >
                  <span style={{
                    width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${activo ? '#6366F1' : 'var(--color-text-4)'}`,
                    background: estado === 'all' ? '#6366F1' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {estado === 'all' && <Check size={9} color="#fff" strokeWidth={4} />}
                    {estado === 'some' && <Minus size={9} color="#6366F1" strokeWidth={4} />}
                  </span>
                  {g.id === BUCKET_SIN_EQUIPO ? <Users size={12} /> : <UsersRound size={12} />}
                  {g.name}
                  <span style={{ opacity: 0.65, fontWeight: 600 }}>{g.members.length}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      <SectionLabel text="O atletas uno por uno" />
      {athletes.map(a => {
        const checked = selected.has(a.id)
        const initials = `${a.first_name[0]}${(a.last_name ?? '')[0] ?? ''}`.toUpperCase()
        return (
          <button
            key={a.id}
            type="button"
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginTop: 2 }}>
                <EtiquetasEquipo groups={a.groups} />
                {a.email && (
                  <span style={{ fontSize: 11.5, color: 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.email}
                  </span>
                )}
              </div>
            </div>
            {alreadyAssigned.includes(a.id) && (
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: 'rgba(34,197,94,0.12)', color: '#22C55E', fontWeight: 600, flexShrink: 0 }}>
                Asignada
              </span>
            )}
          </button>
        )
      })}
    </>
  )
}

export function EtiquetasEquipo({ groups }: { groups: AthleteGroupRef[] }) {
  if (groups.length === 0) {
    return (
      <span
        title="Sin equipo"
        style={{
          fontSize: 10.5, fontWeight: 700, padding: '1.5px 7px', borderRadius: 20,
          background: 'var(--color-surface-2)', color: 'var(--color-text-3)',
          border: '1px solid var(--color-border)',
        }}
      >
        {SIN_EQUIPO}
      </span>
    )
  }
  return (
    <>
      {groups.map(g => (
        <span
          key={g.id}
          style={{
            fontSize: 10.5, fontWeight: 700, padding: '1.5px 7px', borderRadius: 20,
            background: 'rgba(99,102,241,0.10)', color: '#6366F1',
            border: '1px solid rgba(99,102,241,0.22)',
          }}
        >
          {g.name}
        </span>
      ))}
    </>
  )
}

export function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{
      fontSize: 10.5, fontWeight: 700, color: 'var(--color-text-3)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      padding: '14px 22px 8px',
    }}>
      {text}
    </p>
  )
}

/** Grupos presentes entre los atletas, más el bucket de los que no tienen. */
export function derivarGrupos(
  athletes: { id: string; groups: AthleteGroupRef[] }[]
): GrupoDerivado[] {
  const map = new Map<string, GrupoDerivado>()
  for (const a of athletes) {
    for (const g of a.groups) {
      const entry = map.get(g.id) ?? { id: g.id, name: g.name, members: [] }
      entry.members.push(a.id)
      map.set(g.id, entry)
    }
  }
  const list = [...map.values()].sort((x, y) => x.name.localeCompare(y.name, 'es'))
  const huerfanos = athletes.filter(a => a.groups.length === 0).map(a => a.id)
  if (huerfanos.length > 0) {
    list.push({ id: BUCKET_SIN_EQUIPO, name: `Sin equipo (${SIN_EQUIPO})`, members: huerfanos })
  }
  return list
}
