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

/** Una entrada de la agenda del atleta: una rutina o un WOD en un día. */
export interface EntradaAgenda {
  id: string
  scheduled_date: string
  scheduled_time: string | null
  status: TrainingSession['status']
  routine_id: string | null
  wod_id: string | null
  routine: { id: string; name: string; description: string | null; deleted_at?: string | null } | null
  wod: { id: string; name: string; type: string | null; deleted_at?: string | null } | null
}

/**
 * Lo que el atleta tiene programado entre dos fechas, rutinas y WODs juntos.
 *
 * No hay límite por día: si el coach programó tres cosas para el martes, las
 * tres vienen. Antes el panel del atleta leía la programación general del box
 * (getBoxScheduleRange), que es otra cosa: lo que el box publica para todos, no
 * lo que a esta persona le asignaron. Por eso decía "sin WOD" aunque tuviera
 * entrenamientos suyos.
 */
export async function getMiAgenda(desde: string, hasta: string): Promise<EntradaAgenda[]> {
  const supabase = createClient()

  const { data: userRes } = await supabase.auth.getUser()
  if (!userRes.user) return []

  const { data: pub } = await supabase
    .from('users').select('id').eq('auth_user_id', userRes.user.id).maybeSingle()
  if (!pub) return []

  const { data: atleta } = await supabase
    .from('athletes').select('id').eq('user_id', pub.id).maybeSingle()
  if (!atleta) return []

  const { data, error } = await supabase
    .from('training_sessions')
    .select('id, scheduled_date, scheduled_time, status, routine_id, wod_id, routine:routines(id, name, description, deleted_at), wod:wods(id, name, type, deleted_at)')
    .eq('athlete_id', atleta.id)
    .gte('scheduled_date', desde)
    .lte('scheduled_date', hasta)
    .order('scheduled_date')
    .order('scheduled_time', { nullsFirst: true })
  if (error) throw error

  // Si el coach borró la rutina o el WOD, la sesión queda apuntando a algo que
  // ya no existe para nadie. Mostrarla solo confunde: el atleta abriría una
  // ficha vacía.
  const borrado = (x: { deleted_at?: string | null } | null) => !!x?.deleted_at

  return ((data ?? []) as unknown as EntradaAgenda[]).filter(
    e => !borrado(e.routine) && !borrado(e.wod)
  )
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

/**
 * training_sessions.tenant_id es NOT NULL y no tiene default ni trigger, y
 * coach_id referencia users.id (el id publico, no el de auth). Omitirlos hacia
 * que todo insert muriera con violacion de RLS.
 */
async function resolverContexto() {
  const supabase = createClient()
  const { data: userRes } = await supabase.auth.getUser()
  if (!userRes.user) throw new Error('No autenticado')

  const tenantId = userRes.user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) throw new Error('Tu cuenta no tiene organización asignada.')

  const { data: publicUser, error } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', userRes.user.id)
    .maybeSingle()
  if (error) throw error
  if (!publicUser) {
    throw new Error('Tu cuenta de acceso no está vinculada a un perfil de usuario.')
  }

  return { supabase, tenantId, coachId: publicUser.id as string }
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
  const { supabase, tenantId, coachId } = await resolverContexto()
  const { data, error } = await supabase
    .from('training_sessions')
    .insert({ ...session, tenant_id: tenantId, coach_id: coachId })
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
  if (params.athlete_ids.length === 0 || params.dates.length === 0) return []

  const { supabase, tenantId, coachId } = await resolverContexto()

  const rows = params.athlete_ids.flatMap(athlete_id =>
    params.dates.map(scheduled_date => ({
      tenant_id: tenantId,
      coach_id: coachId,
      athlete_id,
      type: params.type,
      scheduled_date,
      scheduled_time: params.scheduled_time ?? null,
      routine_id: params.routine_id ?? null,
      wod_id: params.wod_id ?? null,
      status: 'scheduled',
    }))
  )

  const { data, error } = await supabase
    .from('training_sessions')
    .insert(rows)
    .select()
  if (error) throw error
  return data
}

/** Sesiones ya agendadas de una rutina, para no duplicarlas al reasignar. */
export async function getRoutineSchedule(routineId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_sessions')
    .select('id, athlete_id, scheduled_date, status')
    .eq('routine_id', routineId)
    .order('scheduled_date')
  if (error) throw error
  return (data ?? []) as {
    id: string
    athlete_id: string
    scheduled_date: string
    status: TrainingSession['status']
  }[]
}

/** Quita del calendario las sesiones aun no realizadas de una rutina. */
export async function unscheduleRoutine(routineId: string, sessionIds: string[]) {
  if (sessionIds.length === 0) return
  const supabase = createClient()
  const { error } = await supabase
    .from('training_sessions')
    .delete()
    .eq('routine_id', routineId)
    .in('id', sessionIds)
  if (error) throw error
}
