export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import dynamicImport from 'next/dynamic'
import RoutineList from './RoutineList'

const NewRoutineForm = dynamicImport(() => import('./NewRoutineForm'), { ssr: false })

export default async function RutinasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: routines } = await supabase
    .from('routines')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <header className="sticky top-0 z-10 bg-[#0A0A0A] border-b border-[#2A2A2A] px-4 py-4">
        <h1 className="font-black text-lg tracking-tight">
          ENTRE<span className="text-[#CC2B2B]">BARRAS</span>
        </h1>
        <p className="text-[#666] text-xs mt-0.5">{user?.email}</p>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <NewRoutineForm />
        <RoutineList routines={routines ?? []} />
      </main>
    </div>
  )
}
