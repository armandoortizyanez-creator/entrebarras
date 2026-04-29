'use client'

import Link from 'next/link'
import type { Client } from '@/lib/wod-types'

export default function ClientList({ clients }: { clients: Client[] }) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-[#141414] flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
        </div>
        <p className="text-[#666] text-sm font-medium">Sin clientes aún</p>
        <p className="text-[#444] text-xs mt-1">Usa el botón + para agregar tu primer cliente</p>
      </div>
    )
  }

  const active = clients.filter(c => c.active)
  const inactive = clients.filter(c => !c.active)

  return (
    <div className="space-y-6 mb-24">
      {active.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-3 px-1">
            Activos · {active.length}
          </h2>
          <div className="space-y-2">
            {active.map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </section>
      )}

      {inactive.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-[#666] uppercase tracking-widest mb-3 px-1">
            Inactivos · {inactive.length}
          </h2>
          <div className="space-y-2">
            {inactive.map(client => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ClientCard({ client }: { client: Client }) {
  const initials = client.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Link
      href={`/dashboard/clientes/${client.id}`}
      className="flex items-center gap-4 bg-[#141414] rounded-2xl border border-[#2A2A2A] p-4 hover:border-[#CC2B2B]/50 transition-colors min-h-[72px] active:scale-[0.99]"
    >
      {/* Avatar */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
        client.active ? 'bg-[#CC2B2B]/20 text-[#CC2B2B]' : 'bg-[#1E1E1E] text-[#555]'
      }`}>
        {initials}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className={`font-bold truncate ${client.active ? 'text-white' : 'text-[#666]'}`}>
          {client.name}
        </p>
        {client.email && (
          <p className="text-xs text-[#555] truncate mt-0.5">{client.email}</p>
        )}
        {client.phone && !client.email && (
          <p className="text-xs text-[#555] truncate mt-0.5">{client.phone}</p>
        )}
      </div>

      {/* Status + arrow */}
      <div className="flex items-center gap-2 shrink-0">
        {!client.active && (
          <span className="text-[10px] font-bold text-[#555] bg-[#1E1E1E] px-2 py-0.5 rounded-full uppercase">
            Inactivo
          </span>
        )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </Link>
  )
}
