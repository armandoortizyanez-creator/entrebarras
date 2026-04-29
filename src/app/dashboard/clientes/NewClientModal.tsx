'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewClientModal() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function reset() {
    setName(''); setEmail(''); setPhone(''); setNotes(''); setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre es obligatorio'); return }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      const { error } = await supabase.from('clients').insert({
        trainer_id: user.id,
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
        active: true,
      })
      if (error) throw error
      reset()
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#CC2B2B] rounded-full flex items-center justify-center shadow-lg shadow-[#CC2B2B]/30 hover:bg-[#AA2020] active:scale-95 transition-all z-40"
        aria-label="Agregar cliente"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setOpen(false); reset() }}
          />

          {/* Sheet */}
          <div className="relative w-full sm:max-w-md bg-[#141414] rounded-t-3xl sm:rounded-3xl border-t sm:border border-[#2A2A2A] p-6 pb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-white text-xl">Nuevo cliente</h2>
              <button
                onClick={() => { setOpen(false); reset() }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1E1E1E] text-[#666] hover:text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#666] uppercase tracking-wider block mb-2">
                  Nombre *
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#CC2B2B] transition-colors"
                  placeholder="Pedro Soto"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#666] uppercase tracking-wider block mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#CC2B2B] transition-colors"
                  placeholder="pedro@email.com"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#666] uppercase tracking-wider block mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#CC2B2B] transition-colors"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#666] uppercase tracking-wider block mb-2">
                  Notas
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#CC2B2B] transition-colors resize-none"
                  placeholder="Lesiones, objetivos, nivel..."
                />
              </div>

              {error && (
                <p className="text-[#CC2B2B] text-sm bg-[#CC2B2B]/10 border border-[#CC2B2B]/30 rounded-xl px-4 py-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#CC2B2B] text-white py-4 rounded-xl text-sm font-black hover:bg-[#AA2020] disabled:opacity-50 transition-colors min-h-[56px] mt-2"
              >
                {loading ? 'Guardando...' : 'Agregar cliente'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
