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
      <p className="text-center text-gray-400 text-sm py-8">
        Aún no tenés rutinas. Creá la primera arriba.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Mis rutinas</h2>
      {routines.map(routine => (
        <div key={routine.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{routine.title}</h3>
              <p className="text-sm text-gray-400 mt-0.5">
                {routine.exercises.length} ejercicio{routine.exercises.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => copyLink(routine.share_token)}
              className={`shrink-0 text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                copied === routine.share_token
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {copied === routine.share_token ? '✓ Copiado' : 'Copiar link'}
            </button>
          </div>
          <div className="mt-3 space-y-1">
            {routine.exercises.map((ex, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-gray-400 text-xs w-4">{i + 1}.</span>
                <span className="font-medium">{ex.name}</span>
                <span className="text-gray-400">{ex.sets}×{ex.reps}</span>
                {ex.notes && <span className="text-gray-400 truncate">— {ex.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
