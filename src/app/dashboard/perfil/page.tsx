export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import LogoutButton from './LogoutButton'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { count: clientCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })

  const { count: wodCount } = await supabase
    .from('wods')
    .select('*', { count: 'exact', head: true })

  return (
    <div>
      <header className="sticky top-0 z-10 bg-[#0A0A0A] border-b border-[#2A2A2A] px-4 py-4">
        <h1 className="font-black text-lg tracking-tight">
          ENTRE<span className="text-[#CC2B2B]">BARRAS</span>
        </h1>
        <p className="text-[#666] text-xs mt-0.5">Mi perfil</p>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-[#141414] rounded-2xl border border-[#2A2A2A] p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#CC2B2B]/20 flex items-center justify-center text-[#CC2B2B] text-xl font-black">
              {user?.email?.[0]?.toUpperCase() ?? 'T'}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold truncate">{user?.email}</p>
              <p className="text-[#666] text-sm">Entrenador</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#141414] rounded-2xl border border-[#2A2A2A] p-4 text-center">
            <p className="text-3xl font-black text-[#CC2B2B]">{clientCount ?? 0}</p>
            <p className="text-[#666] text-xs font-semibold uppercase tracking-wide mt-1">Clientes</p>
          </div>
          <div className="bg-[#141414] rounded-2xl border border-[#2A2A2A] p-4 text-center">
            <p className="text-3xl font-black text-[#CC2B2B]">{wodCount ?? 0}</p>
            <p className="text-[#666] text-xs font-semibold uppercase tracking-wide mt-1">WODs</p>
          </div>
        </div>

        <div className="bg-[#141414] rounded-2xl border border-[#2A2A2A] px-5 py-4">
          <LogoutButton />
        </div>
      </main>
    </div>
  )
}
