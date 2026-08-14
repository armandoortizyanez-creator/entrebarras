import { createClient } from '@/lib/supabase/client'

export interface CoachOption {
  id: string
  name: string
  role: string
}

export interface AtletaDeCoach {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  status: string | null
  groups: { id: string; name: string }[]
}

export interface GrupoDeCoach {
  id: string
  name: string
  type: string | null
  athlete_count: number
}

/** Coaches y administradores del box, para los selectores de asignación. */
export async function getCoachOptions(): Promise<CoachOption[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, role, is_active')
    .in('role', ['coach', 'super_admin'])
    .eq('is_active', true)
    .order('first_name')
  if (error) throw error

  return (data ?? []).map(u => ({
    id: u.id as string,
    name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || 'Sin nombre',
    role: u.role as string,
  }))
}

/** Atletas asignados a un coach, con los grupos de cada uno. */
export async function getAtletasDeCoach(coachId: string): Promise<AtletaDeCoach[]> {
  const supabase = createClient()
  const { data: athletes, error } = await supabase
    .from('athletes')
    .select('id, first_name, last_name, email, status')
    .eq('assigned_coach_id', coachId)
    .is('deleted_at', null)
    .order('first_name')
  if (error) throw error
  if (!athletes || athletes.length === 0) return []

  const { data: memberships, error: mErr } = await supabase
    .from('group_athletes')
    .select('athlete_id, group:groups(id, name)')
    .in('athlete_id', athletes.map(a => a.id))
  if (mErr) throw mErr

  const porAtleta = new Map<string, { id: string; name: string }[]>()
  for (const m of memberships ?? []) {
    const g = m.group as unknown as { id: string; name: string } | null
    if (!g) continue
    const lista = porAtleta.get(m.athlete_id as string) ?? []
    lista.push(g)
    porAtleta.set(m.athlete_id as string, lista)
  }

  return athletes.map(a => ({
    id: a.id as string,
    first_name: a.first_name as string,
    last_name: a.last_name as string | null,
    email: a.email as string | null,
    status: a.status as string | null,
    groups: porAtleta.get(a.id as string) ?? [],
  }))
}

/** Grupos que dirige un coach, con cuántos atletas tiene cada uno. */
export async function getGruposDeCoach(coachId: string): Promise<GrupoDeCoach[]> {
  const supabase = createClient()
  const { data: groups, error } = await supabase
    .from('groups')
    .select('id, name, type')
    .eq('coach_id', coachId)
    .order('name')
  if (error) throw error
  if (!groups || groups.length === 0) return []

  const { data: miembros, error: mErr } = await supabase
    .from('group_athletes')
    .select('group_id')
    .in('group_id', groups.map(g => g.id))
  if (mErr) throw mErr

  const conteo = new Map<string, number>()
  for (const m of miembros ?? []) {
    const gid = m.group_id as string
    conteo.set(gid, (conteo.get(gid) ?? 0) + 1)
  }

  return groups.map(g => ({
    id: g.id as string,
    name: g.name as string,
    type: g.type as string | null,
    athlete_count: conteo.get(g.id as string) ?? 0,
  }))
}

/** Reasigna atletas a un coach. Pasar null los deja sin coach. */
export async function asignarAtletasACoach(coachId: string | null, athleteIds: string[]) {
  if (athleteIds.length === 0) return
  const supabase = createClient()
  const { error } = await supabase
    .from('athletes')
    .update({ assigned_coach_id: coachId, updated_at: new Date().toISOString() })
    .in('id', athleteIds)
  if (error) throw error
}

export async function getGruposDeAtleta(athleteId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('group_athletes')
    .select('group_id')
    .eq('athlete_id', athleteId)
  if (error) throw error
  return (data ?? []).map(r => r.group_id as string)
}

/**
 * Deja al atleta exactamente en los grupos indicados: agrega los que faltan y
 * quita los que sobran, en vez de borrar todo y reinsertar.
 */
export async function setGruposDeAtleta(athleteId: string, groupIds: string[]) {
  const supabase = createClient()
  const actuales = await getGruposDeAtleta(athleteId)

  const aAgregar = groupIds.filter(id => !actuales.includes(id))
  const aQuitar = actuales.filter(id => !groupIds.includes(id))

  if (aAgregar.length > 0) {
    const { error } = await supabase
      .from('group_athletes')
      .insert(aAgregar.map(group_id => ({ group_id, athlete_id: athleteId })))
    if (error) throw error
  }

  if (aQuitar.length > 0) {
    const { error } = await supabase
      .from('group_athletes')
      .delete()
      .eq('athlete_id', athleteId)
      .in('group_id', aQuitar)
    if (error) throw error
  }
}

/** Atletas del box que aún no tienen coach o están en otro, para poder sumarlos. */
export async function getAtletasAsignables(): Promise<AtletaDeCoach[]> {
  const supabase = createClient()
  const { data: athletes, error } = await supabase
    .from('athletes')
    .select('id, first_name, last_name, email, status, assigned_coach_id')
    .is('deleted_at', null)
    .order('first_name')
  if (error) throw error

  return (athletes ?? []).map(a => ({
    id: a.id as string,
    first_name: a.first_name as string,
    last_name: a.last_name as string | null,
    email: a.email as string | null,
    status: a.status as string | null,
    groups: [],
  }))
}
