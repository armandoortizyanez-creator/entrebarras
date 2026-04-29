'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { WOD_TYPES, WOD_COLORS, type WodType, type Wod } from '@/lib/wod-types'

type ExerciseField = {
  name: string
  reps: string
  sets: string
  weight_kg: string
  distance_m: string
  calories: string
  time_seconds: string
}

function emptyExercise(): ExerciseField {
  return { name: '', reps: '', sets: '', weight_kg: '', distance_m: '', calories: '', time_seconds: '' }
}

function toNum(s: string): number | null {
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

// Which fields to show per WOD type
const TYPE_FIELDS: Record<WodType, (keyof ExerciseField)[]> = {
  'AMRAP':    ['name', 'reps', 'weight_kg'],
  'FOR TIME': ['name', 'reps', 'sets', 'weight_kg'],
  'EMOM':     ['name', 'reps', 'time_seconds'],
  'TABATA':   ['name', 'reps', 'sets'],
  'RFT':      ['name', 'reps', 'weight_kg'],
  'STRENGTH': ['name', 'sets', 'reps', 'weight_kg'],
  'SKILL':    ['name', 'reps', 'sets'],
}

const FIELD_LABELS: Record<keyof ExerciseField, string> = {
  name:         'Ejercicio',
  reps:         'Reps',
  sets:         'Series',
  weight_kg:    'Kg',
  distance_m:   'Metros',
  calories:     'Cal',
  time_seconds: 'Seg',
}

export default function WodForm({
  clientId,
  defaultDate,
  existingWod,
}: {
  clientId: string
  defaultDate: string
  existingWod?: Wod
}) {
  const router = useRouter()

  const [title, setTitle] = useState(existingWod?.title ?? '')
  const [type, setType] = useState<WodType>((existingWod?.type as WodType) ?? 'AMRAP')
  const [date, setDate] = useState(existingWod?.scheduled_date ?? defaultDate)
  const [duration, setDuration] = useState(existingWod?.duration_min?.toString() ?? '')
  const [rounds, setRounds] = useState(existingWod?.rounds?.toString() ?? '')
  const [notes, setNotes] = useState(existingWod?.notes ?? '')
  const [exercises, setExercises] = useState<ExerciseField[]>(() => {
    if (existingWod?.wod_exercises && existingWod.wod_exercises.length > 0) {
      return existingWod.wod_exercises
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map(ex => ({
          name:         ex.name,
          reps:         ex.reps?.toString() ?? '',
          sets:         ex.sets?.toString() ?? '',
          weight_kg:    ex.weight_kg?.toString() ?? '',
          distance_m:   ex.distance_m?.toString() ?? '',
          calories:     ex.calories?.toString() ?? '',
          time_seconds: ex.time_seconds?.toString() ?? '',
        }))
    }
    return [emptyExercise()]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const activeFields = TYPE_FIELDS[type]
  const accentColor = WOD_COLORS[type]

  function updateExercise(i: number, field: keyof ExerciseField, value: string) {
    setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('El título del WOD es obligatorio'); return }
    if (exercises.some(ex => !ex.name.trim())) { setError('Todos los ejercicios deben tener nombre'); return }
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const wodPayload = {
        trainer_id:     user.id,
        client_id:      clientId,
        title:          title.trim(),
        type,
        scheduled_date: date,
        duration_min:   toNum(duration),
        rounds:         toNum(rounds),
        notes:          notes.trim() || null,
      }

      let wodId: string

      if (existingWod) {
        // Update existing WOD
        const { error: updateErr } = await supabase
          .from('wods')
          .update(wodPayload)
          .eq('id', existingWod.id)
        if (updateErr) throw updateErr
        wodId = existingWod.id

        // Delete old exercises
        await supabase.from('wod_exercises').delete().eq('wod_id', wodId)
      } else {
        // Insert new WOD
        const { data, error: insertErr } = await supabase
          .from('wods')
          .insert(wodPayload)
          .select('id')
          .single()
        if (insertErr) throw insertErr
        wodId = data.id
      }

      // Insert exercises
      if (exercises.length > 0) {
        const exercisePayload = exercises
          .filter(ex => ex.name.trim())
          .map((ex, i) => ({
            wod_id:       wodId,
            name:         ex.name.trim(),
            reps:         toNum(ex.reps),
            sets:         toNum(ex.sets),
            weight_kg:    toNum(ex.weight_kg),
            distance_m:   toNum(ex.distance_m),
            calories:     toNum(ex.calories),
            time_seconds: toNum(ex.time_seconds),
            order_index:  i,
          }))
        const { error: exErr } = await supabase.from('wod_exercises').insert(exercisePayload)
        if (exErr) throw exErr
      }

      router.push(`/dashboard/clientes/${clientId}`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!existingWod || !confirm('¿Eliminar este WOD?')) return
    setDeleting(true)
    try {
      const supabase = createClient()
      await supabase.from('wods').delete().eq('id', existingWod.id)
      router.push(`/dashboard/clientes/${clientId}`)
      router.refresh()
    } catch {
      setError('Error al eliminar')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">

      {/* WOD Type selector */}
      <div>
        <label className="text-xs font-bold text-[#666] uppercase tracking-widest block mb-3">Tipo de WOD</label>
        <div className="grid grid-cols-4 gap-2">
          {WOD_TYPES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all min-h-[44px] ${
                type === t ? 'text-white shadow-lg' : 'bg-[#141414] text-[#555] border border-[#2A2A2A] hover:border-[#444]'
              }`}
              style={type === t ? { backgroundColor: WOD_COLORS[t] } : {}}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs font-bold text-[#666] uppercase tracking-widest block mb-2">Título</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-[#141414] border border-[#2A2A2A] rounded-xl text-white text-sm placeholder-[#555] focus:outline-none transition-colors"
          style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
          onFocus={e => e.currentTarget.style.borderColor = accentColor}
          onBlur={e => e.currentTarget.style.borderColor = '#2A2A2A'}
          placeholder={`WOD ${type} — ${new Date(date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' })}`}
        />
      </div>

      {/* Date */}
      <div>
        <label className="text-xs font-bold text-[#666] uppercase tracking-widest block mb-2">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full px-4 py-3 bg-[#141414] border border-[#2A2A2A] rounded-xl text-white text-sm focus:outline-none transition-colors"
          onFocus={e => e.currentTarget.style.borderColor = accentColor}
          onBlur={e => e.currentTarget.style.borderColor = '#2A2A2A'}
        />
      </div>

      {/* Duration + Rounds (conditional) */}
      {(type === 'AMRAP' || type === 'EMOM' || type === 'TABATA') && (
        <div>
          <label className="text-xs font-bold text-[#666] uppercase tracking-widest block mb-2">
            {type === 'EMOM' ? 'Duración total (min)' : 'Tiempo (min)'}
          </label>
          <input
            type="number"
            min={1}
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="w-full px-4 py-3 bg-[#141414] border border-[#2A2A2A] rounded-xl text-white text-sm placeholder-[#555] focus:outline-none transition-colors"
            onFocus={e => e.currentTarget.style.borderColor = accentColor}
            onBlur={e => e.currentTarget.style.borderColor = '#2A2A2A'}
            placeholder={type === 'AMRAP' ? 'Ej: 20' : 'Ej: 30'}
          />
        </div>
      )}

      {(type === 'RFT' || type === 'STRENGTH') && (
        <div>
          <label className="text-xs font-bold text-[#666] uppercase tracking-widest block mb-2">Rondas</label>
          <input
            type="number"
            min={1}
            value={rounds}
            onChange={e => setRounds(e.target.value)}
            className="w-full px-4 py-3 bg-[#141414] border border-[#2A2A2A] rounded-xl text-white text-sm placeholder-[#555] focus:outline-none transition-colors"
            onFocus={e => e.currentTarget.style.borderColor = accentColor}
            onBlur={e => e.currentTarget.style.borderColor = '#2A2A2A'}
            placeholder="Ej: 5"
          />
        </div>
      )}

      {/* Exercises */}
      <div>
        <label className="text-xs font-bold text-[#666] uppercase tracking-widest block mb-3">
          Ejercicios
        </label>
        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <ExerciseRow
              key={i}
              index={i}
              exercise={ex}
              activeFields={activeFields}
              accentColor={accentColor}
              showRemove={exercises.length > 1}
              onChange={(field, value) => updateExercise(i, field, value)}
              onRemove={() => setExercises(prev => prev.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setExercises(prev => [...prev, emptyExercise()])}
          className="mt-3 flex items-center gap-2 text-sm font-bold min-h-[44px] px-2 transition-colors"
          style={{ color: accentColor }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agregar ejercicio
        </button>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-bold text-[#666] uppercase tracking-widest block mb-2">Notas / Instrucciones</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-[#141414] border border-[#2A2A2A] rounded-xl text-white text-sm placeholder-[#555] focus:outline-none transition-colors resize-none"
          onFocus={e => e.currentTarget.style.borderColor = accentColor}
          onBlur={e => e.currentTarget.style.borderColor = '#2A2A2A'}
          placeholder="Escala: 65 kg en squat. Descanso 2 min entre rondas..."
        />
      </div>

      {error && (
        <p className="text-[#CC2B2B] text-sm bg-[#CC2B2B]/10 border border-[#CC2B2B]/30 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          type="submit"
          disabled={loading}
          className="w-full text-white py-4 rounded-xl text-sm font-black disabled:opacity-50 transition-all min-h-[56px] shadow-lg"
          style={{ backgroundColor: accentColor }}
        >
          {loading ? 'Guardando...' : existingWod ? 'Guardar cambios' : 'Crear WOD'}
        </button>

        {existingWod && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full py-3 rounded-xl text-sm font-semibold text-[#CC2B2B] border border-[#CC2B2B]/30 hover:bg-[#CC2B2B]/10 disabled:opacity-50 transition-colors min-h-[50px]"
          >
            {deleting ? 'Eliminando...' : 'Eliminar WOD'}
          </button>
        )}
      </div>
    </form>
  )
}

function ExerciseRow({
  index,
  exercise,
  activeFields,
  accentColor,
  showRemove,
  onChange,
  onRemove,
}: {
  index: number
  exercise: ExerciseField
  activeFields: (keyof ExerciseField)[]
  accentColor: string
  showRemove: boolean
  onChange: (field: keyof ExerciseField, value: string) => void
  onRemove: () => void
}) {
  const numericFields = activeFields.filter(f => f !== 'name')

  return (
    <div className="bg-[#141414] rounded-2xl border border-[#2A2A2A] p-4 space-y-3">
      {/* Exercise name + remove */}
      <div className="flex items-center gap-2">
        <span className="text-[#555] text-xs font-bold w-5 shrink-0">{index + 1}.</span>
        <input
          value={exercise.name}
          onChange={e => onChange('name', e.target.value)}
          className="flex-1 px-3 py-2.5 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl text-white text-sm placeholder-[#555] focus:outline-none transition-colors"
          onFocus={e => e.currentTarget.style.borderColor = accentColor}
          onBlur={e => e.currentTarget.style.borderColor = '#2A2A2A'}
          placeholder="Nombre del ejercicio"
        />
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#1E1E1E] text-[#555] hover:text-[#CC2B2B] transition-colors shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Numeric fields */}
      {numericFields.length > 0 && (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(numericFields.length, 3)}, 1fr)` }}>
          {numericFields.map(field => (
            <div key={field}>
              <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider block mb-1">
                {FIELD_LABELS[field]}
              </label>
              <input
                type="number"
                min={0}
                step={field === 'weight_kg' ? 0.5 : 1}
                value={exercise[field]}
                onChange={e => onChange(field, e.target.value)}
                className="w-full px-3 py-2 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl text-white text-sm placeholder-[#555] focus:outline-none transition-colors text-center"
                onFocus={e => e.currentTarget.style.borderColor = accentColor}
                onBlur={e => e.currentTarget.style.borderColor = '#2A2A2A'}
                placeholder="—"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
