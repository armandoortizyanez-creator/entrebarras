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

  // box_schedule.tenant_id es NOT NULL y no tiene default: omitirlo hacia que
  // cada guardado muriera con violacion de RLS, sin mensaje visible.
  const { data: userRes } = await supabase.auth.getUser()
  if (!userRes.user) throw new Error('No autenticado')

  const tenantId = userRes.user.app_metadata?.tenant_id as string | undefined
  if (!tenantId) throw new Error('Tu cuenta no tiene organización asignada.')

  const { data, error } = await supabase
    .from('box_schedule')
    .upsert(
      { ...payload, tenant_id: tenantId },
      { onConflict: 'tenant_id,scheduled_date,group_id' }
    )
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
