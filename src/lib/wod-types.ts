export const WOD_TYPES = ['AMRAP', 'FOR TIME', 'EMOM', 'TABATA', 'RFT', 'STRENGTH', 'SKILL'] as const
export type WodType = typeof WOD_TYPES[number]

export const WOD_COLORS: Record<WodType, string> = {
  'AMRAP':    '#CC2B2B',
  'FOR TIME': '#E85D04',
  'EMOM':     '#2B7FCC',
  'TABATA':   '#7B2FCC',
  'RFT':      '#E85D04',
  'STRENGTH': '#2BAF6A',
  'SKILL':    '#888888',
}

export const WOD_LABELS: Record<WodType, string> = {
  'AMRAP':    'AMRAP',
  'FOR TIME': 'FOR TIME',
  'EMOM':     'EMOM',
  'TABATA':   'TABATA',
  'RFT':      'RFT',
  'STRENGTH': 'STRENGTH',
  'SKILL':    'SKILL',
}

export type WodExercise = {
  id?: string
  name: string
  reps: number | null
  sets: number | null
  weight_kg: number | null
  distance_m: number | null
  calories: number | null
  time_seconds: number | null
  order_index: number
}

export type Wod = {
  id: string
  trainer_id: string
  client_id: string
  title: string
  type: WodType
  scheduled_date: string
  duration_min: number | null
  rounds: number | null
  notes: string | null
  completed: boolean
  completed_at: string | null
  created_at: string
  wod_exercises?: WodExercise[]
}

export type Client = {
  id: string
  trainer_id: string
  name: string
  email: string | null
  phone: string | null
  active: boolean
  notes: string | null
  created_at: string
}
