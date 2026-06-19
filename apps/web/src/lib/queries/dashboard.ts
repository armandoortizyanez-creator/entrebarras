import { createClient } from '@/lib/supabase/client'

export async function getDashboardStats() {
  const supabase = createClient()

  const [athletes, sessions, compliance] = await Promise.all([
    supabase.from('athletes').select('id, status').is('deleted_at', null),
    supabase
      .from('training_sessions')
      .select('id, status')
      .gte('scheduled_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
    supabase
      .from('athlete_compliance')
      .select('athlete_id, days_since_last_workout, completed_30d, scheduled_30d')
      .gte('days_since_last_workout', 7),
  ])

  const activeAthletes = athletes.data?.filter(a => a.status === 'active').length ?? 0
  const inactiveAthletes = athletes.data?.filter(a => a.status === 'inactive').length ?? 0
  const weekSessions = sessions.data?.length ?? 0
  const completedSessions = sessions.data?.filter(s => s.status === 'completed').length ?? 0
  const atRisk = compliance.data?.length ?? 0

  const complianceRate = weekSessions > 0
    ? Math.round((completedSessions / weekSessions) * 100)
    : null

  return {
    activeAthletes,
    inactiveAthletes,
    weekSessions,
    completedSessions,
    complianceRate,
    atRisk,
  }
}
