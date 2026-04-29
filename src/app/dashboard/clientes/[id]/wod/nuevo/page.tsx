export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import WodForm from '../WodForm'

export default async function NuevoWodPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ fecha?: string }>
}) {
  const { id } = await params
  const { fecha } = await searchParams

  const supabase = await createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const defaultDate = fecha ?? new Date().toISOString().split('T')[0]

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
            <h1 className="font-black text-white">Nuevo WOD</h1>
            <p className="text-[#666] text-xs">{client.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <WodForm clientId={id} defaultDate={defaultDate} />
      </main>
    </div>
  )
}
