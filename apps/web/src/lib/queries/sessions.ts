import { createClient } from '@/lib/supabase/client'

export interface TrainingSession {
  id: string
  tenant_id: string
  athlete_id: string
  coach_id: string | null
  routine_id: string | null
  wod_id: string | null
  group_id: string | null
  type: 'routine' | 'wod' | 'rest' | 'event'
  scheduled_date: string
  scheduled_time: string | null
  status: 'scheduled' | 'started' | 'completed' | 'skipped'
  notes: string | null
  created_at: string
  athlete?: { id: string; first_name: string; last_name: string }
  routine?: { id: string; name: string } | null
  wod?: { id: string; name: string } | null
}

export async function getSessionsByMonth(year: number, month: number) {
  const supabase = createClient()
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('training_sessions')
    .select(`
      *,
      athlete:athletes(id, first_name, last_name),
      routine:routines(id, name),
      wod:wods(id, name)
    `)
    .gte('scheduled_date', start)
    .lte('scheduled_date', end)
    .order('scheduled_date')
    .order('scheduled_time')

  if (error) throw error
  return data as TrainingSession[]
}

export async function getSessionsByAthlete(athleteId: string, from?: string, to?: string) {
  const supabase = createClient()
  let q = supabase
    .from('training_sessions')
    .select('*, routine:routines(id, name), wod:wods(id, name)')
    .eq('athlete_id', athleteId)
    .order('scheduled_date')

  if (from) q = q.gte('scheduled_date', from)
  if (to) q = q.lte('scheduled_date', to)

  const { data, error } = await q
  if (error) throw error
  return data as TrainingSession[]
}

export async function createSession(session: {
  athlete_id: string
  type: 'routine' | 'wod' | 'rest' | 'event'
  scheduled_date: string
  scheduled_time?: string
  routine_id?: string
  wod_id?: string
  notes?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_sessions')
    .insert(session)
    .select()
    .single()
  if (error) throw error
  return data as TrainingSession
}

export async function updateSessionStatus(id: string, status: TrainingSession['status']) {
  const supabase = createClient()
  const updates: Record<string, unknown> = { status }
  if (status === 'started') updates.started_at = new Date().toISOString()
  if (status === 'completed') updates.completed_at = new Date().toISOString()

  const { error } = await supabase
    .from('training_sessions')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function deleteSession(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('training_sessions').delete().eq('id', id)
  if (error) throw error
}

export async function bulkAssign(params: {
  athlete_ids: string[]
  type: 'routine' | 'wod'
  routine_id?: string
  wod_id?: string
  dates: string[]
  scheduled_time?: string
}) {
  const supabase = createClient()
  const rows = params.athlete_ids.flatMap(athlete_id =>
    params.dates.map(scheduled_date => ({
      athlete_id,
      type: params.type,
      scheduled_date,
      scheduled_time: params.scheduled_time ?? null,
      routine_id: params.routine_id ?? null,
      wod_id: params.wod_id ?? null,
    }))
  )

  const { data, error } = await supabase
    .from('training_sessions')
    .insert(rows)
    .select()
  if (error) throw error
  return data
}
