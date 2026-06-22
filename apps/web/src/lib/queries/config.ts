import { createClient } from '@/lib/supabase/client'

export interface TenantProfile {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan_tier: string
  settings: Record<string, unknown>
  is_active: boolean
}

export interface UserProfile {
  id: string
  auth_user_id: string
  role: string
  first_name: string
  last_name: string
  avatar_url: string | null
  phone: string | null
}

export async function getTenantProfile(): Promise<TenantProfile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const tenantId = user.app_metadata?.tenant_id
  if (!tenantId) return null

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (error) throw error
  return data as TenantProfile
}

export async function updateTenantProfile(updates: { name?: string; logo_url?: string }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const tenantId = user.app_metadata?.tenant_id
  const { error } = await supabase
    .from('tenants')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', tenantId)

  if (error) throw error
}

export async function getMyProfile(): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (error) throw error
  return data as UserProfile
}

export async function updateMyProfile(updates: { first_name?: string; last_name?: string; phone?: string }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('auth_user_id', user.id)

  if (error) throw error

  await supabase.auth.updateUser({
    data: { first_name: updates.first_name, last_name: updates.last_name },
  })
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function getCoaches() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('role', ['super_admin', 'coach'])
    .order('first_name')

  if (error) throw error
  return data as UserProfile[]
}

export async function getSubscription() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const tenantId = user.app_metadata?.tenant_id
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}
