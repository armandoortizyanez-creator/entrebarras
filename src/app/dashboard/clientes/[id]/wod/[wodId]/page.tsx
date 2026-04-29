export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import dynamicImport from 'next/dynamic'

const WodForm = dynamicImport(() => import('../WodForm'), { ssr: false })

export default async function EditarWodPage({
  params,
}: {
  params: Promise<{ id: string; wodId: string }>
}) {
  const { id, wodId } = await params
  const supabase = await createClient()

  const [{ data: client }, { data: wod }] = await Promise.all([
    supabase.from('clients').select('id, name').eq('id', id).single(),
    supabase.from('wods').select('*, wod_exercises(*)').eq('id', wodId).single(),
  ])

  if (!client || !wod) notFound()

  return (
    <div>
      <header className="sticky top-0 z-10 bg-[#0A0A0A] border-b border-[#2A2A2A] px-4 py-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <a
            href={`/dashboard/clientes/${id}`}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#141414] text-[#AAA] hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </a>
          <div>
            <h1 className="font-black text-white">Editar WOD</h1>
            <p className="text-[#666] text-xs">{client.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <WodForm clientId={id} defaultDate={wod.scheduled_date} existingWod={wod} />
      </main>
    </div>
  )
}
