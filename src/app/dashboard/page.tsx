export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import dynamic from 'next/dynamic'
import RoutineList from './RoutineList'

const LogoutButton = dynamic(() => import('./LogoutButton'), { ssr: false })
const NewRoutineForm = dynamic(() => import('./NewRoutineForm'), { ssr: false })

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: routines } = await supabase
    .from('routines')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-lg">Entrebarras</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <NewRoutineForm />
        <RoutineList routines={routines ?? []} />
      </main>
    </div>
  )
}
