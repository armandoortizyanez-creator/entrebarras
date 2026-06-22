'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@entrebarras/types'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const tenantId  = user?.app_metadata?.tenant_id as string | undefined
  const role      = user?.app_metadata?.role as UserRole | undefined

  const isPlatformAdmin = role === 'platform_admin'
  const isSuperAdmin    = role === 'super_admin'
  const isCoach         = role === 'coach' || role === 'super_admin' || role === 'platform_admin'
  const isAthlete       = role === 'athlete'

  const canManageUsers       = isPlatformAdmin || isSuperAdmin
  const canManageCoaches     = isPlatformAdmin || isSuperAdmin
  const canInvite            = isPlatformAdmin || isSuperAdmin || role === 'coach'
  const canViewAllTenants    = isPlatformAdmin
  const canCreateGlobalClasses = isPlatformAdmin || isSuperAdmin

  return {
    user,
    loading,
    tenantId,
    role,
    isPlatformAdmin,
    isSuperAdmin,
    isCoach,
    isAthlete,
    canManageUsers,
    canManageCoaches,
    canInvite,
    canViewAllTenants,
    canCreateGlobalClasses,
    // legacy alias
    isOwner: isSuperAdmin,
  }
}
