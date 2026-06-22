import { createClient } from '@/lib/supabase/client'

export interface PersonalRecord {
  id: string
  athlete_id: string
  movement_name: string
  weight_kg: number
  reps: number
  estimated_1rm: number | null
  recorded_at: string
  notes: string | null
  created_at: string
}

// Epley formula — most common 1RM estimator
export function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}

// Generate percentage table from 50% to 105% in 5% steps
export function percentageTable(oneRM: number) {
  const steps = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105]
  return steps.map(pct => ({
    pct,
    kg: Math.round((oneRM * pct / 100) * 10) / 10,
    // Round to nearest 2.5kg for practical use
    kg_rounded: Math.round((oneRM * pct / 100) / 2.5) * 2.5,
  }))
}

// Get best (highest estimated_1rm or weight_kg when reps=1) per movement for an athlete
export async function getLatestPRs(athleteId: string): Promise<PersonalRecord[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('recorded_at', { ascending: false })

  if (error) throw error

  // Group by movement — keep the one with highest estimated_1rm (or weight_kg if no estimate)
  const best = new Map<string, PersonalRecord>()
  for (const pr of data ?? []) {
    const prev = best.get(pr.movement_name)
    const val = pr.estimated_1rm ?? pr.weight_kg
    const prevVal = prev ? (prev.estimated_1rm ?? prev.weight_kg) : -1
    if (val > prevVal) best.set(pr.movement_name, pr)
  }

  return Array.from(best.values()).sort((a, b) =>
    a.movement_name.localeCompare(b.movement_name)
  )
}

// Full history for a specific movement + athlete
export async function getPRHistory(athleteId: string, movementName: string): Promise<PersonalRecord[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('athlete_id', athleteId)
    .eq('movement_name', movementName)
    .order('recorded_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function savePR(record: {
  athlete_id: string
  movement_name: string
  weight_kg: number
  reps: number
  recorded_at: string
  notes?: string
}): Promise<PersonalRecord> {
  const supabase = createClient()

  const estimated_1rm = record.reps > 1 ? epley1RM(record.weight_kg, record.reps) : null

  const { data, error } = await supabase
    .from('personal_records')
    .insert({ ...record, estimated_1rm })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePR(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('personal_records').delete().eq('id', id)
  if (error) throw error
}
