import { createClient } from '@/lib/supabase/client'

export interface RoutineWithBlocks {
  id: string
  name: string
  description: string | null
  type: string | null
  is_template: boolean
  tags: string[]
  created_at: string
  blocks: RoutineBlockFull[]
}

export interface BlockLink {
  label: string
  url: string
}

export interface RoutineBlockFull {
  id: string
  routine_id: string
  order_index: number
  type: string
  name: string | null
  notes: string | null
  content: string | null
  links: BlockLink[]
  wod_type: string | null
  time_cap: number | null
  interval_work_s: number | null
  interval_rest_s: number | null
  rounds: number | null
  exercises: RoutineExerciseFull[]
}

export interface RoutineExerciseFull {
  id: string
  block_id: string
  exercise_id: string
  order_index: number
  sets: number | null
  reps: string | null
  weight_kg: number | null
  weight_percent: number | null
  time_seconds: number | null
  rest_seconds: number | null
  rpe: number | null
  notes: string | null
  equipment: string | null
  exercise: { id: string; name: string; muscle_group: string | null; gif_url: string | null }
}

export async function getRoutines() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getRoutine(id: string): Promise<RoutineWithBlocks> {
  const supabase = createClient()
  const { data: routine, error: rErr } = await supabase
    .from('routines')
    .select('*')
    .eq('id', id)
    .single()
  if (rErr) throw rErr

  const { data: blocks, error: bErr } = await supabase
    .from('routine_blocks')
    .select('*')
    .eq('routine_id', id)
    .order('order_index')
  if (bErr) throw bErr

  const blockIds = blocks.map((b: { id: string }) => b.id)
  let exercises: RoutineExerciseFull[] = []

  if (blockIds.length > 0) {
    const { data: exs, error: eErr } = await supabase
      .from('routine_exercises')
      .select('*, exercise:exercises(id, name, muscle_group, gif_url)')
      .in('block_id', blockIds)
      .order('order_index')
    if (eErr) throw eErr
    exercises = exs as RoutineExerciseFull[]
  }

  return {
    ...routine,
    blocks: blocks.map((b: { id: string }) => ({
      ...b,
      exercises: exercises.filter(e => e.block_id === b.id),
    })),
  }
}

export async function createRoutine(data: {
  name: string
  description?: string
  type?: string
  is_template?: boolean
}) {
  const supabase = createClient()
  const { data: userRes } = await supabase.auth.getUser()
  if (!userRes.user) throw new Error('No autenticado')

  const tenantId = userRes.user.app_metadata?.tenant_id
  if (!tenantId) throw new Error('Tu cuenta no tiene organización asignada. Contacta al administrador de tu box.')

  const role = userRes.user.app_metadata?.role
  if (role !== 'coach' && role !== 'super_admin' && role !== 'platform_admin') {
    throw new Error('Tu cuenta no tiene permisos para crear rutinas.')
  }

  // maybeSingle: si la cuenta de auth no tiene ficha en `users`, .single() lanzaba
  // un error opaco de PostgREST en vez de decir qué pasa realmente.
  const { data: publicUser, error: uErr } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', userRes.user.id)
    .maybeSingle()
  if (uErr) throw uErr
  if (!publicUser) {
    throw new Error('Tu cuenta de acceso no está vinculada a un perfil de usuario. Contacta al administrador de tu box.')
  }

  const { data: routine, error } = await supabase
    .from('routines')
    .insert({ ...data, created_by: publicUser.id, tenant_id: tenantId })
    .select()
    .single()
  if (error) throw error
  return routine
}

export async function addBlock(routineId: string, orderIndex: number, type = 'standard', extra?: {
  wod_type?: string; time_cap?: number; interval_work_s?: number; interval_rest_s?: number; rounds?: number; name?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('routine_blocks')
    .insert({ routine_id: routineId, order_index: orderIndex, type, ...extra })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function addExerciseToBlock(blockId: string, exerciseId: string, orderIndex: number, params: {
  sets?: number; reps?: string; weight_kg?: number; weight_percent?: number; rest_seconds?: number; rpe?: number; notes?: string; equipment?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('routine_exercises')
    .insert({ block_id: blockId, exercise_id: exerciseId, order_index: orderIndex, ...params })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRoutineExercise(id: string, updates: {
  sets?: number; reps?: string; weight_kg?: number; weight_percent?: number; rest_seconds?: number; rpe?: number; notes?: string; equipment?: string | null
}) {
  const supabase = createClient()
  const { error } = await supabase
    .from('routine_exercises')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function removeExerciseFromBlock(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('routine_exercises').delete().eq('id', id)
  if (error) throw error
}

export async function deleteBlock(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('routine_blocks').delete().eq('id', id)
  if (error) throw error
}

export async function updateBlock(id: string, data: {
  name?: string | null; type?: string; notes?: string
  content?: string | null; links?: BlockLink[]
  wod_type?: string | null; time_cap?: number | null
  interval_work_s?: number | null; interval_rest_s?: number | null; rounds?: number | null
}) {
  const supabase = createClient()
  const { error } = await supabase.from('routine_blocks').update(data).eq('id', id)
  if (error) throw error
}

export async function assignRoutineToAthletes(routineId: string, athleteIds: string[]) {
  const supabase = createClient()
  const { data: userRes } = await supabase.auth.getUser()
  const rows = athleteIds.map(aid => ({
    athlete_id: aid,
    routine_id: routineId,
    assigned_by: userRes.user?.id,
    is_active: true,
  }))
  const { error } = await supabase
    .from('athlete_routines')
    .upsert(rows, { onConflict: 'athlete_id,routine_id' })
  if (error) throw error
}

export async function getRoutineAssignments(routineId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('athlete_routines')
    .select('athlete_id')
    .eq('routine_id', routineId)
    .eq('is_active', true)
  if (error) throw error
  return (data ?? []).map(r => r.athlete_id as string)
}

export async function removeRoutineAssignment(athleteId: string, routineId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('athlete_routines')
    .delete()
    .eq('athlete_id', athleteId)
    .eq('routine_id', routineId)
  if (error) throw error
}

export async function updateRoutine(id: string, data: { name?: string; description?: string; type?: string; is_template?: boolean }) {
  const supabase = createClient()
  const { error } = await supabase
    .from('routines')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteRoutine(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('routines')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export interface AssignedRoutineSummary {
  id: string
  name: string
  description: string | null
  type: string | null
  tags: string[]
  blocks_count: number
  assigned_at: string
}

export async function getMyAssignedRoutines(): Promise<AssignedRoutineSummary[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Look up public user record to get the public user ID
  const { data: pubUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (!pubUser) return []

  // Find athlete record linked to the public user
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', pubUser.id)
    .maybeSingle()
  if (!athlete) return []

  const { data, error } = await supabase
    .from('athlete_routines')
    .select('created_at, routine:routines(id, name, description, type, tags, deleted_at)')
    .eq('athlete_id', athlete.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error

  type RoutineRow = { id: string; name: string; description: string | null; type: string | null; tags: string[]; deleted_at: string | null }

  const rows = (data ?? []).filter(r => {
    const rt = r.routine as unknown as RoutineRow | null
    return rt && !rt.deleted_at
  })

  const routineIds = rows.map(r => (r.routine as unknown as RoutineRow).id)
  const blockCounts: Record<string, number> = {}
  if (routineIds.length > 0) {
    const { data: blocks } = await supabase
      .from('routine_blocks')
      .select('routine_id')
      .in('routine_id', routineIds)
    ;(blocks ?? []).forEach(b => {
      blockCounts[b.routine_id] = (blockCounts[b.routine_id] ?? 0) + 1
    })
  }

  return rows.map(r => {
    const rt = r.routine as unknown as RoutineRow
    return {
      id: rt.id,
      name: rt.name,
      description: rt.description,
      type: rt.type,
      tags: rt.tags ?? [],
      blocks_count: blockCounts[rt.id] ?? 0,
      assigned_at: r.created_at,
    }
  })
}
