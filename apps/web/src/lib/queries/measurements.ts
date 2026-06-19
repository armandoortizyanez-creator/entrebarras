import { createClient } from '@/lib/supabase/client'

export interface BodyMeasurement {
  id: string
  athlete_id: string
  measured_at: string
  weight_kg: number | null
  height_cm: number | null
  body_fat_pct: number | null
  muscle_mass_kg: number | null
  bmi: number | null
  notes: string | null
  created_at: string
}

export async function getMeasurements(athleteId: string): Promise<BodyMeasurement[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('measured_at', { ascending: false })

  if (error) throw error
  return data as BodyMeasurement[]
}

export async function addMeasurement(measurement: {
  athlete_id: string
  measured_at: string
  weight_kg?: number
  height_cm?: number
  body_fat_pct?: number
  muscle_mass_kg?: number
  notes?: string
}): Promise<BodyMeasurement> {
  const supabase = createClient()

  const bmi = measurement.weight_kg && measurement.height_cm
    ? parseFloat((measurement.weight_kg / Math.pow(measurement.height_cm / 100, 2)).toFixed(1))
    : undefined

  const { data, error } = await supabase
    .from('body_measurements')
    .insert({ ...measurement, bmi })
    .select()
    .single()

  if (error) throw error
  return data as BodyMeasurement
}

export async function deleteMeasurement(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('body_measurements').delete().eq('id', id)
  if (error) throw error
}
