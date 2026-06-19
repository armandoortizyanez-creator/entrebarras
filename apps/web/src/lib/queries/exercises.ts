import { createClient } from '@/lib/supabase/client'
import type { Exercise } from '@entrebarras/types'

export async function getExercises(filters?: {
  search?: string
  muscle_group?: string
  equipment?: string
  source?: 'exercisedb' | 'custom'
}) {
  const supabase = createClient()
  let query = supabase
    .from('exercises')
    .select('*')
    .order('name')
    .limit(100)

  if (filters?.source) query = query.eq('source', filters.source)
  if (filters?.muscle_group) query = query.eq('muscle_group', filters.muscle_group)
  if (filters?.equipment) query = query.eq('equipment', filters.equipment)

  const { data, error } = await query
  if (error) throw error
  return data as Exercise[]
}

export async function createExercise(exercise: Partial<Exercise>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .insert(exercise)
    .select()
    .single()
  if (error) throw error
  return data as Exercise
}
