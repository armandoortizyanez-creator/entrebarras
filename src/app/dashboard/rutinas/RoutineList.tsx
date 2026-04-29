'use client'

import { useState } from 'react'

type Exercise = { name: string; sets: number; reps: number; notes?: string }
type Routine = { id: string; title: string; exercises: Exercise[]; share_token: string; created_at: string }

export default function RoutineList({ routines }: { routines: Routine[] }) {
  const [copied, setCopied] = useState<string | null>(null)

  function copyLink(token: string) {
    const url = `${window.location.origin}/r/${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  if (routines.length === 0) {
    return (
      <p className="text-center text-[#555] text-sm py-12">
        Sin rutinas aún. Crea la primera arriba.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold text-[#666] uppercase tracking-widest px-1">Mis rutinas</h2>
      {routines.map(routine => (
        <div key={routine.id} className="bg-[#141414] rounded-2xl border border-[#2A2A2A] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-white truncate">{routine.title}</h3>
              <p className="text-sm text-[#666] mt-0.5">
                {routine.exercises.length} ejercicio{routine.exercises.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => copyLink(routine.share_token)}
              className={`shrink-0 text-xs px-3 py-2 rounded-lg font-bold transition-colors min-h-[36px] ${
                copied === routine.share_token
                  ? 'bg-[#2BAF6A]/20 text-[#2BAF6A]'
                  : 'bg-[#1E1E1E] text-[#AAA] hover:bg-[#2A2A2A]'
              }`}
            >
              {copied === routine.share_token ? '✓ Copiado' : 'Copiar link'}
            </button>
          </div>
          <div className="mt-3 space-y-1.5">
            {routine.exercises.map((ex, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-[#555] text-xs w-4">{i + 1}.</span>
                <span className="text-white font-medium">{ex.name}</span>
                <span className="text-[#666]">{ex.sets}×{ex.reps}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
