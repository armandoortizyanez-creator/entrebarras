import { createClient } from '@/lib/supabase/client'

export interface WodResult {
  id: string
  wod_id: string
  athlete_id: string | null
  scale: 'rx' | 'scaled' | 'foundations'
  time_s: number | null
  rounds: number | null
  reps: number | null
  weight_kg: number | null
  result_text: string | null
  notes: string | null
  recorded_at: string
  created_at: string
  athlete?: { first_name: string; last_name: string } | null
}

export function formatResultTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

export function buildResultText(data: Pick<WodResult, 'time_s' | 'rounds' | 'reps' | 'weight_kg'>): string {
  if (data.time_s != null) return formatResultTime(data.time_s)
  if (data.rounds != null && data.reps != null) return `${data.rounds} + ${data.reps}`
  if (data.rounds != null) return `${data.rounds} rondas`
  if (data.reps != null) return `${data.reps} reps`
  if (data.weight_kg != null) return `${data.weight_kg} kg`
  return ''
}

export const SCALE_LABELS: Record<string, string> = {
  rx: 'Rx',
  scaled: 'Scaled',
  foundations: 'Foundations',
}

export const SCALE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  rx:          { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  scaled:      { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  foundations: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
}

export async function getWodResults(wodId: string): Promise<WodResult[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wod_results')
    .select('*, athlete:athlete_id(first_name, last_name)')
    .eq('wod_id', wodId)
    .order('recorded_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as WodResult[]
}

export async function saveWodResult(payload: {
  wod_id: string
  athlete_id?: string | null
  scale: string
  time_s?: number | null
  rounds?: number | null
  reps?: number | null
  weight_kg?: number | null
  notes?: string
  recorded_at?: string
}): Promise<WodResult> {
  const supabase = createClient()
  const result_text = buildResultText({
    time_s: payload.time_s ?? null,
    rounds: payload.rounds ?? null,
    reps: payload.reps ?? null,
    weight_kg: payload.weight_kg ?? null,
  })
  const recorded_at = payload.recorded_at ?? new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('wod_results')
    .insert({ ...payload, result_text, recorded_at })
    .select('*, athlete:athlete_id(first_name, last_name)')
    .single()

  if (error) throw error
  return data as WodResult
}

export async function deleteWodResult(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('wod_results').delete().eq('id', id)
  if (error) throw error
}

// For reports: athlete result history across all WODs
export async function getAthleteWodResults(athleteId: string, limit = 20): Promise<(WodResult & { wod_name?: string })[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('wod_results')
    .select('*, wod:wod_id(name)')
    .eq('athlete_id', athleteId)
    .order('recorded_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map((r: any) => ({ ...r, wod_name: r.wod?.name }))
}
