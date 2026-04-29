export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import ClientList from './ClientList'
import NewClientModal from './NewClientModal'

export default async function ClientesPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div>
      <header className="sticky top-0 z-10 bg-[#0A0A0A] border-b border-[#2A2A2A] px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="font-black text-lg tracking-tight">
              ENTRE<span className="text-[#CC2B2B]">BARRAS</span>
            </h1>
            <p className="text-[#666] text-xs mt-0.5">Mis clientes</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <ClientList clients={clients ?? []} />
        <NewClientModal />
      </main>
    </div>
  )
}
