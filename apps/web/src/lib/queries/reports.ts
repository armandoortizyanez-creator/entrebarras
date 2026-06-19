import { createClient } from '@/lib/supabase/client'

export async function getRetentionReport() {
  const supabase = createClient()

  const [compliance, athletes] = await Promise.all([
    supabase.from('athlete_compliance').select('*').order('days_since_last_workout', { ascending: false }),
    supabase.from('athletes').select('id, status, created_at').is('deleted_at', null),
  ])

  if (compliance.error) throw compliance.error
  if (athletes.error) throw athletes.error

  const data = compliance.data ?? []
  const total = data.length

  const atRiskHigh = data.filter(a => (a.days_since_last_workout ?? 99) >= 14).length
  const atRiskMed = data.filter(a => {
    const d = a.days_since_last_workout ?? 99
    return d >= 7 && d < 14
  }).length
  const active = data.filter(a => (a.days_since_last_workout ?? 99) < 7).length
  const never = data.filter(a => a.days_since_last_workout === null).length

  const avgCompliance = total > 0
    ? Math.round(data.reduce((acc, a) => {
        const pct = a.scheduled_30d > 0 ? (a.completed_30d / a.scheduled_30d) * 100 : 0
        return acc + pct
      }, 0) / total)
    : 0

  return {
    total,
    active,
    atRiskMed,
    atRiskHigh,
    never,
    avgCompliance,
    athletes: data,
  }
}

export async function getSessionReport() {
  const supabase = createClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('training_sessions')
    .select('status, type, scheduled_date')
    .gte('scheduled_date', thirtyDaysAgo)
    .order('scheduled_date')

  if (error) throw error

  const total = data.length
  const completed = data.filter(s => s.status === 'completed').length
  const skipped = data.filter(s => s.status === 'skipped').length
  const scheduled = data.filter(s => s.status === 'scheduled').length

  const byType = data.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + 1
    return acc
  }, {})

  const byWeek: Record<string, { total: number; completed: number }> = {}
  data.forEach(s => {
    const d = new Date(s.scheduled_date)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().split('T')[0]
    if (!byWeek[key]) byWeek[key] = { total: 0, completed: 0 }
    byWeek[key].total++
    if (s.status === 'completed') byWeek[key].completed++
  })

  return {
    total, completed, skipped, scheduled,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    byType,
    byWeek: Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, v]) => ({ week, ...v })),
  }
}
