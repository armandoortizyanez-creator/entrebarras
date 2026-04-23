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
  const supabase = createClient()

  function updateExercise(i: number, field: keyof Exercise, value: string | number) {
    setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex))
  }

  function addExercise() {
    setExercises(prev => [...prev, emptyExercise()])
  }

  function removeExercise(i: number) {
    setExercises(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('El nombre de la rutina es obligatorio'); return }
    if (exercises.some(ex => !ex.name.trim())) { setError('Todos los ejercicios deben tener nombre'); return }
    setLoading(true)
    try {
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
        className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-8 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors text-sm font-medium"
      >
        + Nueva rutina
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <h2 className="font-semibold text-lg mb-4">Nueva rutina</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la rutina</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Ej: Pecho y tríceps — Semana 1"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Ejercicios</label>
          {exercises.map((ex, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  value={ex.name}
                  onChange={e => updateExercise(i, 'name', e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Nombre del ejercicio"
                />
                {exercises.length > 1 && (
                  <button type="button" onClick={() => removeExercise(i)} className="text-gray-400 hover:text-red-500 text-sm px-2">✕</button>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Series</label>
                  <input
                    type="number" min={1} max={20}
                    value={ex.sets}
                    onChange={e => updateExercise(i, 'sets', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Reps</label>
                  <input
                    type="number" min={1} max={100}
                    value={ex.reps}
                    onChange={e => updateExercise(i, 'reps', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
              <input
                value={ex.notes}
                onChange={e => updateExercise(i, 'notes', e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Nota (opcional): 2 min descanso, al fallo..."
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addExercise}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            + Agregar ejercicio
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar rutina'}
          </button>
        </div>
      </form>
    </div>
  )
}
