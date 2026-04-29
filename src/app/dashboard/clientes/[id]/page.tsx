export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import dynamicImport from 'next/dynamic'

const ClientCalendar = dynamicImport(() => import('./ClientCalendar'), { ssr: false })

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  // Fetch WODs for the next 4 weeks (to show in calendar)
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - today.getDay() + 1) // This Monday
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 27) // 4 weeks

  const { data: wods } = await supabase
    .from('wods')
    .select('*, wod_exercises(*)')
    .eq('client_id', id)
    .gte('scheduled_date', startDate.toISOString().split('T')[0])
    .lte('scheduled_date', endDate.toISOString().split('T')[0])
    .order('scheduled_date', { ascending: true })

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0A0A0A] border-b border-[#2A2A2A] px-4 py-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <a href="/dashboard/clientes" className="w-9 h-9 flex items-center justify-center rounded-full bg-[#141414] text-[#AAA] hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </a>
          <div className="min-w-0">
            <h1 className="font-black text-white truncate">{client.name}</h1>
            <p className="text-[#666] text-xs">
              {client.active ? 'Activo' : 'Inactivo'}{client.email ? ` · ${client.email}` : ''}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <ClientCalendar
          client={client}
          initialWods={wods ?? []}
          weekStart={startDate.toISOString().split('T')[0]}
        />
      </main>
    </div>
  )
}
