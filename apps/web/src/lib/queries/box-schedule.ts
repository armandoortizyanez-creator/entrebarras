import { createClient } from '@/lib/supabase/client'

export interface BoxScheduleEntry {
  id: string
  scheduled_date: string
  wod_id: string | null
  routine_id: string | null
  group_id: string | null
  notes: string | null
  created_at: string
  wod?: { id: string; name: string; type: string } | null
  routine?: { id: string; name: string } | null
  group?: { id: string; name: string } | null
}

export async function getBoxScheduleRange(from: string, to: string): Promise<BoxScheduleEntry[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('box_schedule')
    .select('*, wod:wod_id(id,name,type), routine:routine_id(id,name), group:group_id(id,name)')
    .gte('scheduled_date', from)
    .lte('scheduled_date', to)
    .order('scheduled_date')

  if (error) throw error
  return (data ?? []) as BoxScheduleEntry[]
}

export async function upsertBoxSchedule(payload: {
  scheduled_date: string
  wod_id?: string | null
  routine_id?: string | null
  group_id?: string | null
  notes?: string
}): Promise<BoxScheduleEntry> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('box_schedule')
    .upsert(payload, { onConflict: 'tenant_id,scheduled_date,group_id' })
    .select('*, wod:wod_id(id,name,type), routine:routine_id(id,name), group:group_id(id,name)')
    .single()

  if (error) throw error
  return data as BoxScheduleEntry
}

export async function deleteBoxSchedule(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('box_schedule').delete().eq('id', id)
  if (error) throw error
}
