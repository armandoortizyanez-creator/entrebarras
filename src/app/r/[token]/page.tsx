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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Tu rutina</p>
          <h1 className="text-2xl font-bold text-gray-900">{routine.title}</h1>
          <p className="text-sm text-gray-400 mt-1">{exercises.length} ejercicios</p>
        </div>

        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start gap-3">
                <span className="bg-black text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900">{ex.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {ex.sets} series × {ex.reps} reps
                  </p>
                  {ex.notes && (
                    <p className="text-sm text-gray-400 mt-1 italic">{ex.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-300 mt-8">
          Hecho con Entrebarras
        </p>
      </div>
    </div>
  )
}
