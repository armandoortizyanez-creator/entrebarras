import { createClient } from '@/lib/supabase/client'
import type { Athlete } from '@entrebarras/types'

export async function getAthletes(filters?: {
  status?: string
  search?: string
  coach_id?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('athletes')
    .select('*')
    .is('deleted_at', null)
    .order('first_name')

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.coach_id) query = query.eq('assigned_coach_id', filters.coach_id)

  const { data, error } = await query
  if (error) throw error
  return data as Athlete[]
}

export interface AthleteGroupRef {
  id: string
  name: string
}

export interface AthleteWithGroups {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  groups: AthleteGroupRef[]
}

/**
 * Atletas activos con los grupos a los que pertenecen.
 * Un atleta puede estar en varios grupos, o en ninguno (se muestra como S/E).
 */
export async function getAthletesWithGroups(): Promise<AthleteWithGroups[]> {
  const supabase = createClient()

  const { data: athletes, error } = await supabase
    .from('athletes')
    .select('id, first_name, last_name, email')
    .is('deleted_at', null)
    .eq('status', 'active')
    .order('first_name')
  if (error) throw error
  if (!athletes || athletes.length === 0) return []

  const { data: memberships, error: mErr } = await supabase
    .from('group_athletes')
    .select('athlete_id, group:groups(id, name)')
    .in('athlete_id', athletes.map(a => a.id))
  if (mErr) throw mErr

  const byAthlete = new Map<string, AthleteGroupRef[]>()
  for (const m of memberships ?? []) {
    const g = m.group as unknown as AthleteGroupRef | null
    if (!g) continue
    const list = byAthlete.get(m.athlete_id as string) ?? []
    list.push(g)
    byAthlete.set(m.athlete_id as string, list)
  }

  return athletes.map(a => ({
    id: a.id as string,
    first_name: a.first_name as string,
    last_name: a.last_name as string | null,
    email: a.email as string | null,
    groups: byAthlete.get(a.id as string) ?? [],
  }))
}

export async function getAthlete(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as Athlete
}

export async function createAthlete(athlete: Partial<Athlete>) {
  const supabase = createClient()
  const { data: userRes } = await supabase.auth.getUser()
  if (!userRes.user) throw new Error('No autenticado')

  const tenantId = userRes.user.app_metadata?.tenant_id
  if (!tenantId) throw new Error('Sin organización asignada')

  const role = userRes.user.app_metadata?.role

  let assignedCoachId: string | undefined
  if (role === 'coach') {
    const { data: publicUser, error: uErr } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userRes.user.id)
      .single()
    if (uErr) throw uErr
    assignedCoachId = publicUser.id
  }

  const { data, error } = await supabase
    .from('athletes')
    .insert({
      ...athlete,
      tenant_id: tenantId,
      ...(assignedCoachId ? { assigned_coach_id: assignedCoachId } : {}),
    })
    .select()
    .single()
  if (error) throw error
  return data as Athlete
}

export async function updateAthlete(id: string, updates: Partial<Athlete>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('athletes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Athlete
}

export async function deleteAthlete(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('athletes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// Get the athlete profile for the currently logged-in user
export async function getMyAthlete(): Promise<Athlete | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: pubUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (!pubUser) return null

  const { data } = await supabase
    .from('athletes')
    .select('*')
    .eq('user_id', pubUser.id)
    .maybeSingle()

  return data as Athlete | null
}

export async function getComplianceData() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('athlete_compliance')
    .select('*')
    .order('days_since_last_workout', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data
}
