import { createClient } from '@/lib/supabase/client'

export interface SessionLog {
  id: string
  session_id: string
  exercise_id: string | null
  routine_exercise_id: string | null
  exercise_name: string | null
  athlete_id: string | null
  feeling: number | null
  rpe: number | null
  notes: string | null
  completed_at: string | null
  duration_s: number | null
  created_at: string
  sets: SetLog[]
}

export interface SetLog {
  id: string
  session_log_id: string
  set_number: number
  reps_completed: number | null
  weight_kg: number | null
  time_s: number | null
  distance_m: number | null
  rpe: number | null
  is_pr: boolean
  notes: string | null
  exercise_name: string | null
  created_at: string
}

export async function getSessionLogs(sessionId: string): Promise<SessionLog[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('session_logs')
    .select('*, sets:set_logs(*)')
    .eq('session_id', sessionId)
    .order('created_at')

  if (error) throw error
  return (data ?? []) as SessionLog[]
}

export async function upsertSessionLog(payload: {
  session_id: string
  exercise_id?: string | null
  routine_exercise_id?: string | null
  exercise_name?: string | null
  athlete_id?: string | null
  feeling?: number | null
  rpe?: number | null
  notes?: string | null
}): Promise<SessionLog> {
  const supabase = createClient()

  // Check if log already exists for this session+exercise
  const { data: existing } = await supabase
    .from('session_logs')
    .select('id')
    .eq('session_id', payload.session_id)
    .eq('routine_exercise_id', payload.routine_exercise_id ?? '')
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('session_logs')
      .update({ feeling: payload.feeling, rpe: payload.rpe, notes: payload.notes })
      .eq('id', existing.id)
      .select('*, sets:set_logs(*)')
      .single()
    if (error) throw error
    return data as SessionLog
  }

  const { data, error } = await supabase
    .from('session_logs')
    .insert(payload)
    .select('*, sets:set_logs(*)')
    .single()
  if (error) throw error
  return data as SessionLog
}

export async function createSessionLog(payload: {
  session_id: string
  exercise_id?: string | null
  routine_exercise_id?: string | null
  exercise_name?: string | null
  athlete_id?: string | null
}): Promise<SessionLog> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('session_logs')
    .insert(payload)
    .select('*, sets:set_logs(*)')
    .single()
  if (error) throw error
  return data as SessionLog
}

export async function updateSessionLog(id: string, updates: {
  feeling?: number | null
  rpe?: number | null
  notes?: string | null
  completed_at?: string | null
  duration_s?: number | null
}): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('session_logs').update(updates).eq('id', id)
  if (error) throw error
}

export async function addSetLog(payload: {
  session_log_id: string
  set_number: number
  reps_completed?: number | null
  weight_kg?: number | null
  time_s?: number | null
  distance_m?: number | null
  rpe?: number | null
  is_pr?: boolean
  notes?: string | null
  exercise_name?: string | null
}): Promise<SetLog> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('set_logs')
    .insert({ is_pr: false, ...payload })
    .select()
    .single()
  if (error) throw error
  return data as SetLog
}

export async function updateSetLog(id: string, updates: {
  reps_completed?: number | null
  weight_kg?: number | null
  rpe?: number | null
  is_pr?: boolean
  notes?: string | null
}): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('set_logs').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteSetLog(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('set_logs').delete().eq('id', id)
  if (error) throw error
}
