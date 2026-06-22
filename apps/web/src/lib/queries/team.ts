import { createClient } from '@/lib/supabase/client'

export interface TeamMember {
  id: string
  auth_user_id: string
  role: string
  first_name: string
  last_name: string
  avatar_url: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  athlete_count?: number
}

export interface InvitationRow {
  id: string
  email: string
  role: string
  expires_at: string
  accepted_at: string | null
  created_at: string
  invited_by: string
  inviter_name?: string
}

export interface GroupRow {
  id: string
  name: string
  description: string | null
  type: string
  coach_id: string | null
  coach_name?: string
  day_of_week: number[]
  start_time: string | null
  end_time: string | null
  max_capacity: number | null
  is_global: boolean
  sport: string | null
  created_at: string
  athlete_count?: number
}

// ── Coaches ────────────────────────────────────────────────
export async function getCoachTeam(): Promise<TeamMember[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('role', ['super_admin', 'coach'])
    .eq('is_active', true)
    .order('role', { ascending: true })
    .order('first_name')

  if (error) throw error

  // get athlete counts per coach
  const { data: counts } = await supabase
    .from('athletes')
    .select('assigned_coach_id')
    .eq('status', 'active')

  const countMap: Record<string, number> = {}
  for (const row of counts ?? []) {
    if (row.assigned_coach_id) {
      countMap[row.assigned_coach_id] = (countMap[row.assigned_coach_id] ?? 0) + 1
    }
  }

  return (data ?? []).map(u => ({ ...u, athlete_count: countMap[u.auth_user_id] ?? 0 }))
}

export async function deactivateTeamMember(userId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('users')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

export async function reactivateTeamMember(userId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('users')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

export async function assignAthleteToCoach(athleteId: string, coachAuthId: string | null) {
  const supabase = createClient()
  const { error } = await supabase
    .from('athletes')
    .update({ assigned_coach_id: coachAuthId, updated_at: new Date().toISOString() })
    .eq('id', athleteId)
  if (error) throw error
}

// ── Invitations ────────────────────────────────────────────
export async function getInvitations(): Promise<InvitationRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invitations')
    .select('*, inviter:invited_by(first_name, last_name)')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => {
    const inviterData = row.inviter as { first_name?: string; last_name?: string } | null
    return {
      ...(row as unknown as InvitationRow),
      inviter_name: inviterData
        ? `${inviterData.first_name ?? ''} ${inviterData.last_name ?? ''}`.trim()
        : '',
    }
  })
}

export async function createInvitation(email: string, role: 'super_admin' | 'coach' | 'athlete') {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: inviter } = await supabase
    .from('users')
    .select('id, tenant_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!inviter) throw new Error('Usuario no encontrado')

  const { data: inv, error } = await supabase
    .from('invitations')
    .insert({
      tenant_id: inviter.tenant_id,
      invited_by: inviter.id,
      email,
      role,
    })
    .select('id')
    .single()

  if (error) throw error

  // Fire-and-forget — don't block the UI on email delivery
  if (inv?.id) {
    fetch('/api/invite/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId: inv.id }),
    }).catch(() => {/* non-critical */})
  }
}

export async function deleteInvitation(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('invitations').delete().eq('id', id)
  if (error) throw error
}

// ── Groups ─────────────────────────────────────────────────
export async function getGroups(): Promise<GroupRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('groups')
    .select('*, coach:coach_id(first_name, last_name)')
    .order('is_global', { ascending: false })
    .order('name')

  if (error) throw error

  const { data: memberCounts } = await supabase
    .from('group_athletes')
    .select('group_id')

  const countMap: Record<string, number> = {}
  for (const row of memberCounts ?? []) {
    countMap[row.group_id] = (countMap[row.group_id] ?? 0) + 1
  }

  return (data ?? []).map((g: Record<string, unknown>) => {
    const coachData = g.coach as { first_name?: string; last_name?: string } | null
    return {
      ...(g as unknown as GroupRow),
      coach_name: coachData
        ? `${coachData.first_name ?? ''} ${coachData.last_name ?? ''}`.trim()
        : undefined,
      athlete_count: countMap[g.id as string] ?? 0,
    }
  })
}

export async function createGroup(payload: {
  name: string
  description?: string
  type: 'class' | 'program' | 'team'
  day_of_week: number[]
  start_time?: string
  end_time?: string
  max_capacity?: number
  is_global: boolean
  sport?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: me } = await supabase
    .from('users')
    .select('id, tenant_id, auth_user_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!me) throw new Error('Usuario no encontrado')

  const { error } = await supabase.from('groups').insert({
    tenant_id: me.tenant_id,
    coach_id: payload.is_global ? null : me.auth_user_id,
    name: payload.name,
    description: payload.description ?? null,
    type: payload.type,
    day_of_week: payload.day_of_week,
    start_time: payload.start_time ?? null,
    end_time: payload.end_time ?? null,
    max_capacity: payload.max_capacity ?? null,
    is_global: payload.is_global,
    sport: payload.sport ?? null,
  })

  if (error) throw error
}

export async function deleteGroup(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('groups').delete().eq('id', id)
  if (error) throw error
}

export async function addAthleteToGroup(groupId: string, athleteId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('group_athletes')
    .insert({ group_id: groupId, athlete_id: athleteId })
  if (error && error.code !== '23505') throw error // ignore duplicate
}

export async function removeAthleteFromGroup(groupId: string, athleteId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('group_athletes')
    .delete()
    .eq('group_id', groupId)
    .eq('athlete_id', athleteId)
  if (error) throw error
}

// ── Platform admin: all tenants ────────────────────────────
export async function getAllTenants() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getTenantStats(tenantId: string) {
  const supabase = createClient()
  const [users, athletes, sessions] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('athletes').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'active'),
    supabase.from('training_sessions').select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'completed'),
  ])
  return {
    users: users.count ?? 0,
    athletes: athletes.count ?? 0,
    sessions: sessions.count ?? 0,
  }
}
