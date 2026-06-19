// ============================================
// ENTRE BARRAS — Shared Types
// ============================================

// --- Enums ---

export type UserRole = 'owner' | 'coach' | 'athlete'
export type PlanTier = 'trial' | 'starter' | 'growth' | 'pro'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled'
export type SportLevel = 'beginner' | 'intermediate' | 'advanced' | 'competitive'
export type AthleteStatus = 'active' | 'inactive' | 'prospect'
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type ExerciseSource = 'exercisedb' | 'custom'
export type RoutineType = 'strength' | 'hypertrophy' | 'cardio' | 'crossfit' | 'rehab' | 'general'
export type BlockType = 'standard' | 'superset' | 'circuit'
export type WodType = 'amrap' | 'emom' | 'for_time' | 'tabata' | 'chipper' | 'intervals' | 'custom'
export type SessionType = 'routine' | 'wod' | 'rest' | 'event'
export type SessionStatus = 'scheduled' | 'started' | 'completed' | 'skipped'

// --- Core Entities ---

export interface Tenant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan_tier: PlanTier
  settings: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  tenant_id: string
  auth_user_id: string
  role: UserRole
  first_name: string
  last_name: string
  avatar_url: string | null
  phone: string | null
  nationality: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Athlete {
  id: string
  tenant_id: string
  user_id: string | null
  assigned_coach_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  nationality: string | null
  avatar_url: string | null
  primary_sport: string | null
  sport_level: SportLevel | null
  facility: string | null
  gender: Gender | null
  date_of_birth: string | null
  weight_kg: number | null
  height_cm: number | null
  blood_type: string | null
  injuries: string[]
  restrictions: string[]
  medical_notes: string | null
  status: AthleteStatus
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Coach {
  id: string
  tenant_id: string
  user_id: string
  bio: string | null
  specialties: string[]
  certifications: string[]
  created_at: string
  user?: User
}

export interface Group {
  id: string
  tenant_id: string
  name: string
  type: 'class' | 'program' | 'team'
  coach_id: string | null
  schedule: Record<string, unknown> | null
  created_at: string
}

export interface Exercise {
  id: string
  tenant_id: string | null
  source: ExerciseSource
  external_id: string | null
  name: string
  description: string | null
  instructions: string[]
  muscle_group: string | null
  secondary_muscles: string[]
  equipment: string | null
  category: string | null
  gif_url: string | null
  video_url: string | null
  image_url: string | null
  is_public: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface RoutineExerciseConfig {
  sets: number | null
  reps: string | null
  weight_kg: number | null
  time_seconds: number | null
  distance_meters: number | null
  rest_seconds: number | null
  rpe: number | null
  notes: string | null
}

export interface RoutineExercise extends RoutineExerciseConfig {
  id: string
  block_id: string
  exercise_id: string
  order_index: number
  exercise?: Exercise
}

export interface RoutineBlock {
  id: string
  routine_id: string
  order_index: number
  type: BlockType
  name: string | null
  notes: string | null
  exercises: RoutineExercise[]
}

export interface Routine {
  id: string
  tenant_id: string
  created_by: string
  name: string
  description: string | null
  type: RoutineType | null
  is_template: boolean
  tags: string[]
  created_at: string
  updated_at: string
  deleted_at: string | null
  blocks?: RoutineBlock[]
}

export interface WodMovement {
  id: string
  wod_id: string
  exercise_id: string | null
  order_index: number
  name: string
  reps: string | null
  weight_kg: number | null
  distance_m: number | null
  calories: number | null
  notes: string | null
}

export interface Wod {
  id: string
  tenant_id: string
  created_by: string
  name: string
  description: string | null
  type: WodType
  rounds: number | null
  time_cap_s: number | null
  work_s: number | null
  rest_s: number | null
  is_template: boolean
  tags: string[]
  created_at: string
  updated_at: string
  deleted_at: string | null
  movements?: WodMovement[]
}

export interface TrainingSession {
  id: string
  tenant_id: string
  athlete_id: string
  coach_id: string | null
  routine_id: string | null
  wod_id: string | null
  type: SessionType
  scheduled_date: string
  scheduled_time: string | null
  status: SessionStatus
  started_at: string | null
  completed_at: string | null
  duration_s: number | null
  notes: string | null
  created_at: string
  updated_at: string
  athlete?: Pick<Athlete, 'id' | 'first_name' | 'last_name' | 'avatar_url'>
  routine?: Pick<Routine, 'id' | 'name'>
  wod?: Pick<Wod, 'id' | 'name' | 'type'>
}

export interface SetLog {
  id: string
  session_log_id: string
  set_number: number
  reps_completed: number | null
  weight_kg: number | null
  time_s: number | null
  distance_m: number | null
  is_pr: boolean
  created_at: string
}

export interface SessionLog {
  id: string
  session_id: string
  exercise_id: string | null
  notes: string | null
  feeling: number | null
  rpe: number | null
  wod_result: string | null
  created_at: string
  sets?: SetLog[]
}

export interface BodyMeasurement {
  id: string
  athlete_id: string
  measured_at: string
  weight_kg: number | null
  height_cm: number | null
  body_fat_pct: number | null
  muscle_mass_kg: number | null
  bmi: number | null
  photo_front_url: string | null
  photo_side_url: string | null
  photo_back_url: string | null
  notes: string | null
  created_at: string
}

// --- Analytics ---

export interface AthleteCompliance {
  athlete_id: string
  tenant_id: string
  first_name: string
  last_name: string
  assigned_coach_id: string | null
  sessions_last_7d: number
  completed_30d: number
  scheduled_30d: number
  last_workout_at: string | null
  days_since_last_workout: number | null
}

// --- Subscription ---

export interface Subscription {
  id: string
  tenant_id: string
  plan_tier: PlanTier
  status: SubscriptionStatus
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  stripe_customer_id: string | null
  stripe_sub_id: string | null
  payment_provider: 'stripe' | 'mercadopago' | 'flow'
  currency: string
  created_at: string
}

// --- Auth ---

export interface AuthUser {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
  }
  app_metadata: {
    tenant_id?: string
    role?: UserRole
  }
}
