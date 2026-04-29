'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Exercise = { name: string; sets: number; reps: number; notes: string }
const emptyExercise = (): Exercise => ({ name: '', sets: 3, reps: 10, notes: '' })

export default function NewRoutineForm() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([emptyExercise()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function updateExercise(i: number, field: keyof Exercise, value: string | number) {
    setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('El nombre de la rutina es obligatorio'); return }
    if (exercises.some(ex => !ex.name.trim())) { setError('Todos los ejercicios deben tener nombre'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      const { error } = await supabase.from('routines').insert({
        trainer_id: user.id,
        title: title.trim(),
        exercises,
      })
      if (error) throw error
      setTitle('')
      setExercises([emptyExercise()])
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border-2 border-dashed border-[#2A2A2A] rounded-2xl py-6 text-[#555] hover:border-[#CC2B2B] hover:text-[#CC2B2B] transition-colors text-sm font-semibold min-h-[56px]"
      >
        + Nueva rutina
      </button>
    )
  }

  return (
    <div className="bg-[#141414] rounded-2xl border border-[#2A2A2A] p-5">
      <h2 className="font-bold text-white mb-4">Nueva rutina</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#CC2B2B] transition-colors"
          placeholder="Nombre de la rutina"
        />

        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <div key={i} className="bg-[#1E1E1E] rounded-xl p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  value={ex.name}
                  onChange={e => updateExercise(i, 'name', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#CC2B2B] transition-colors"
                  placeholder="Ejercicio"
                />
                {exercises.length > 1 && (
                  <button type="button" onClick={() => setExercises(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-[#666] hover:text-[#CC2B2B] px-2 transition-colors min-w-[36px]">✕</button>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-[#666] block mb-1">Series</label>
                  <input type="number" min={1} max={20} value={ex.sets}
                    onChange={e => updateExercise(i, 'sets', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#CC2B2B] transition-colors"/>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-[#666] block mb-1">Reps</label>
                  <input type="number" min={1} max={100} value={ex.reps}
                    onChange={e => updateExercise(i, 'reps', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#CC2B2B] transition-colors"/>
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setExercises(prev => [...prev, emptyExercise()])}
            className="text-sm text-[#CC2B2B] font-medium min-h-[44px] px-2">
            + Agregar ejercicio
          </button>
        </div>

        {error && (
          <p className="text-[#CC2B2B] text-sm bg-[#CC2B2B]/10 border border-[#CC2B2B]/30 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => setOpen(false)}
            className="flex-1 py-3 border border-[#2A2A2A] rounded-xl text-sm font-semibold text-[#AAA] hover:border-[#444] transition-colors min-h-[50px]">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-[#CC2B2B] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#AA2020] disabled:opacity-50 transition-colors min-h-[50px]">
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
