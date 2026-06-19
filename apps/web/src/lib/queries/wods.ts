import { createClient } from '@/lib/supabase/client'

export interface WodWithMovements {
  id: string
  name: string
  description: string | null
  type: string
  rounds: number | null
  time_cap_s: number | null
  work_s: number | null
  rest_s: number | null
  is_template: boolean
  tags: string[]
  created_at: string
  movements: WodMovementFull[]
}

export interface WodMovementFull {
  id: string
  wod_id: string
  order_index: number
  name: string
  reps: string | null
  weight_kg: number | null
  distance_m: number | null
  calories: number | null
  notes: string | null
  exercise_id: string | null
}

export const WOD_TYPES = [
  { value: 'amrap', label: 'AMRAP', desc: 'As Many Rounds As Possible' },
  { value: 'emom', label: 'EMOM', desc: 'Every Minute On the Minute' },
  { value: 'for_time', label: 'For Time', desc: 'Completar lo más rápido posible' },
  { value: 'tabata', label: 'Tabata', desc: '20s trabajo / 10s descanso' },
  { value: 'chipper', label: 'Chipper', desc: 'Lista larga de movimientos una sola vez' },
  { value: 'intervals', label: 'Intervalos', desc: 'Trabajo por intervalos personalizados' },
  { value: 'custom', label: 'Personalizado', desc: 'Formato libre' },
]

export async function getWods() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wods')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getWod(id: string): Promise<WodWithMovements> {
  const supabase = createClient()
  const [{ data: wod, error: wErr }, { data: movements, error: mErr }] = await Promise.all([
    supabase.from('wods').select('*').eq('id', id).single(),
    supabase.from('wod_movements').select('*').eq('wod_id', id).order('order_index'),
  ])
  if (wErr) throw wErr
  if (mErr) throw mErr
  return { ...wod, movements: movements ?? [] }
}

export async function createWod(data: {
  name: string; type: string; description?: string
  rounds?: number; time_cap_s?: number; work_s?: number; rest_s?: number
  is_template?: boolean
}) {
  const supabase = createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('No autenticado')

  const { data: wod, error } = await supabase
    .from('wods')
    .insert({ ...data, created_by: user.user.id })
    .select()
    .single()
  if (error) throw error
  return wod
}

export async function addMovement(wodId: string, movement: {
  name: string; order_index: number
  reps?: string; weight_kg?: number; distance_m?: number; calories?: number; notes?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wod_movements')
    .insert({ wod_id: wodId, ...movement })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMovement(id: string, updates: Partial<WodMovementFull>) {
  const supabase = createClient()
  const { error } = await supabase.from('wod_movements').update(updates).eq('id', id)
  if (error) throw error
}

export async function removeMovement(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('wod_movements').delete().eq('id', id)
  if (error) throw error
}

export async function deleteWod(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('wods')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
