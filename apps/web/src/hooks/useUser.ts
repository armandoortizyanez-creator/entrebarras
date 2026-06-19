'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

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

  const tenantId = user?.app_metadata?.tenant_id as string | undefined
  const role = user?.app_metadata?.role as 'owner' | 'coach' | 'athlete' | undefined
  const isOwner = role === 'owner'
  const isCoach = role === 'coach' || role === 'owner'

  return { user, loading, tenantId, role, isOwner, isCoach }
}
