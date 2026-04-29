export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'

type Exercise = { name: string; sets: number; reps: number; notes?: string }

export default async function RoutinePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: routine, error } = await supabase
    .from('routines')
    .select('title, exercises, created_at')
    .eq('share_token', token)
    .single()

  if (error || !routine) notFound()

  const exercises = routine.exercises as Exercise[]

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-8">
          <p className="text-xs text-[#CC2B2B] uppercase tracking-widest font-bold mb-2">
            ENTRE<span className="text-[#666]">BARRAS</span>
          </p>
          <h1 className="text-2xl font-black text-white">{routine.title}</h1>
          <p className="text-sm text-[#666] mt-1">{exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <div key={i} className="bg-[#141414] rounded-2xl border border-[#2A2A2A] p-4">
              <div className="flex items-start gap-3">
                <span className="bg-[#CC2B2B] text-white text-xs font-black w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h2 className="font-bold text-white">{ex.name}</h2>
                  <p className="text-sm text-[#888] mt-0.5">
                    {ex.sets} series × {ex.reps} reps
                  </p>
                  {ex.notes && (
                    <p className="text-sm text-[#666] mt-1">{ex.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[#444] mt-10">
          Enviado con Entrebarras · entrebarras.com
        </p>
      </div>
    </div>
  )
}
