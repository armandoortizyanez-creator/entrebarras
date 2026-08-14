import { createClient } from '@/lib/supabase/client'
import type { Exercise } from '@entrebarras/types'

export async function getExercises(filters?: {
  search?: string
  muscle_group?: string
  equipment?: string
  source?: 'exercisedb' | 'custom' | 'crossfit' | 'strength' | 'hyrox' | 'gymnastics'
}) {
  const supabase = createClient()
  let query = supabase
    .from('exercises')
    .select('*')
    .order('name')
    .limit(1000)

  if (filters?.source) query = query.eq('source', filters.source)
  if (filters?.muscle_group) query = query.ilike('muscle_group', filters.muscle_group)
  if (filters?.equipment) query = query.eq('equipment', filters.equipment)
  if (filters?.search) query = query.ilike('name', `%${filters.search}%`)

  const { data, error } = await query
  if (error) throw error
  return data as Exercise[]
}

export async function createExercise(exercise: Partial<Exercise>) {
  const supabase = createClient()
  const { data: userRes } = await supabase.auth.getUser()
  if (!userRes.user) throw new Error('No autenticado')

  const tenantId = userRes.user.app_metadata?.tenant_id ?? null

  // exercises.created_by referencia users.id (el id publico), no el de auth.
  const { data: publicUser, error: uErr } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', userRes.user.id)
    .maybeSingle()
  if (uErr) throw uErr
  if (!publicUser) {
    throw new Error('Tu cuenta de acceso no está vinculada a un perfil de usuario.')
  }

  const { data, error } = await supabase
    .from('exercises')
    .insert({ ...exercise, tenant_id: tenantId, created_by: publicUser.id })
    .select()
    .single()
  if (error) throw error
  return data as Exercise
}
