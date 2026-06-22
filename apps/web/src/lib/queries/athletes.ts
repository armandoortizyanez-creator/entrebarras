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
  const { data, error } = await supabase
    .from('athletes')
    .insert(athlete)
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

  const { data } = await supabase
    .from('athletes')
    .select('*')
    .eq('user_id', user.id)
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
