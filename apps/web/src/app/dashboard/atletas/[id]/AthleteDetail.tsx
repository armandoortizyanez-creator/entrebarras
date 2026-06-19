'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAthlete, updateAthlete } from '@/lib/queries/athletes'
import { getSessionsByAthlete } from '@/lib/queries/sessions'
import { getMeasurements, addMeasurement, deleteMeasurement } from '@/lib/queries/measurements'
import type { Athlete } from '@entrebarras/types'
import Link from 'next/link'

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado', competitive: 'Competitivo',
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'var(--color-info)', started: 'var(--color-warning)',
  completed: 'var(--color-success)', skipped: 'var(--color-text-4)',
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Programado', started: 'En curso', completed: 'Completado', skipped: 'Saltado',
}

export function AthleteDetail({ athleteId }: { athleteId: string }) {
  const [tab, setTab] = useState<'perfil' | 'sesiones' | 'mediciones'>('perfil')

  const { data: athlete, isLoading } = useQuery({
    queryKey: ['athlete', athleteId],
    queryFn: () => getAthlete(athleteId),
  })

  if (isLoading) return <div style={{ padding: 40, color: 'var(--color-text-3)' }}>Cargando...</div>
  if (!athlete) return <div style={{ padding: 40, color: 'var(--color-error)' }}>Atleta no encontrado</div>

  const initials = `${athlete.first_name[0]}${athlete.last_name[0]}`.toUpperCase()
  const age = athlete.date_of_birth
    ? Math.floor((Date.now() - new Date(athlete.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null

  const tabs = [
    { id: 'perfil' as const, label: 'Perfil' },
    { id: 'sesiones' as const, label: 'Historial' },
    { id: 'mediciones' as const, label: 'Mediciones' },
  ]

  return (
    <div style={{ padding: '32px 40px', maxWidth: 860 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
        <Link href="/dashboard/atletas" style={{ fontSize: 20, color: 'var(--color-text-3)', textDecoration: 'none', marginTop: 6 }}>←</Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--color-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
                {athlete.first_name} {athlete.last_name}
              </h1>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
                {athlete.primary_sport && (
                  <span style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{athlete.primary_sport}</span>
                )}
                {athlete.sport_level && (
                  <span style={{ fontSize: 12, color: 'var(--color-text-3)', background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                    {LEVEL_LABELS[athlete.sport_level]}
                  </span>
                )}
                {age && <span style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{age} años</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--color-text)' : 'var(--color-text-3)',
              borderBottom: `2px solid ${tab === t.id ? 'var(--color-red)' : 'transparent'}`,
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'perfil'     && <PerfilTab athlete={athlete} />}
      {tab === 'sesiones'   && <SesionesTab athleteId={athleteId} />}
      {tab === 'mediciones' && <MedicionesTab athleteId={athleteId} />}
    </div>
  )
}

function PerfilTab({ athlete }: { athlete: Athlete }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    first_name: athlete.first_name,
    last_name: athlete.last_name,
    email: athlete.email ?? '',
    phone: athlete.phone ?? '',
    primary_sport: athlete.primary_sport ?? '',
    sport_level: athlete.sport_level ?? '',
    status: athlete.status ?? 'active',
    gender: athlete.gender ?? '',
    date_of_birth: athlete.date_of_birth ?? '',
    weight_kg: athlete.weight_kg?.toString() ?? '',
    height_cm: athlete.height_cm?.toString() ?? '',
    medical_notes: athlete.medical_notes ?? '',
  })
  const [saved, setSaved] = useState(false)

  const mutation = useMutation({
    mutationFn: () => updateAthlete(athlete.id, {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      primary_sport: form.primary_sport || undefined,
      sport_level: (form.sport_level as Athlete['sport_level']) || undefined,
      status: form.status as Athlete['status'],
      gender: (form.gender as Athlete['gender']) || undefined,
      date_of_birth: form.date_of_birth || undefined,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      height_cm: form.height_cm ? Number(form.height_cm) : undefined,
      medical_notes: form.medical_notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['athlete', athlete.id] })
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const fields = [
    { group: 'Personal', items: [
      { label: 'Nombre', key: 'first_name', type: 'text' },
      { label: 'Apellido', key: 'last_name', type: 'text' },
      { label: 'Email', key: 'email', type: 'email' },
      { label: 'Teléfono', key: 'phone', type: 'text' },
      { label: 'Fecha de nacimiento', key: 'date_of_birth', type: 'date' },
      { label: 'Género', key: 'gender', type: 'select', options: [
        { value: '', label: 'Sin definir' },
        { value: 'male', label: 'Masculino' },
        { value: 'female', label: 'Femenino' },
        { value: 'other', label: 'Otro' },
        { value: 'prefer_not_to_say', label: 'Prefiero no decir' },
      ]},
    ]},
    { group: 'Deportivo', items: [
      { label: 'Deporte principal', key: 'primary_sport', type: 'text' },
      { label: 'Nivel', key: 'sport_level', type: 'select', options: [
        { value: '', label: 'Sin definir' },
        { value: 'beginner', label: 'Principiante' },
        { value: 'intermediate', label: 'Intermedio' },
        { value: 'advanced', label: 'Avanzado' },
        { value: 'competitive', label: 'Competitivo' },
      ]},
      { label: 'Estado', key: 'status', type: 'select', options: [
        { value: 'active', label: 'Activo' },
        { value: 'inactive', label: 'Inactivo' },
        { value: 'prospect', label: 'Prospecto' },
      ]},
    ]},
    { group: 'Físico', items: [
      { label: 'Peso (kg)', key: 'weight_kg', type: 'number' },
      { label: 'Estatura (cm)', key: 'height_cm', type: 'number' },
    ]},
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {fields.map(group => (
        <div key={group.group} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{group.group}</h3>
            {!editing && group.group === 'Personal' && (
              <button onClick={() => setEditing(true)} style={{ fontSize: 13, color: 'var(--color-red)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Editar</button>
            )}
          </div>
          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {group.items.map(field => (
              <div key={field.key}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{field.label}</p>
                {editing ? (
                  field.type === 'select' ? (
                    <select
                      value={(form as any)[field.key]}
                      onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)' }}
                    >
                      {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={(form as any)[field.key]}
                      onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }}
                    />
                  )
                ) : (
                  <p style={{ fontSize: 14, color: 'var(--color-text)' }}>
                    {(form as any)[field.key] || <span style={{ color: 'var(--color-text-4)' }}>Sin datos</span>}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {athlete.medical_notes !== undefined && (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notas médicas</h3>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {editing ? (
              <textarea
                value={form.medical_notes}
                onChange={e => setForm(p => ({ ...p, medical_notes: e.target.value }))}
                rows={3}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
              />
            ) : (
              <p style={{ fontSize: 14, color: form.medical_notes ? 'var(--color-text)' : 'var(--color-text-4)' }}>
                {form.medical_notes || 'Sin notas médicas'}
              </p>
            )}
          </div>
        </div>
      )}

      {editing && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setEditing(false)} style={{ padding: '9px 20px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, cursor: 'pointer', background: 'transparent', color: 'var(--color-text)' }}>
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            style={{ padding: '9px 20px', background: saved ? 'var(--color-success)' : 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, cursor: mutation.isPending ? 'not-allowed' : 'pointer' }}
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </div>
  )
}

function SesionesTab({ athleteId }: { athleteId: string }) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['athlete-sessions', athleteId],
    queryFn: () => getSessionsByAthlete(athleteId, thirtyDaysAgo),
  })

  const completed = sessions.filter(s => s.status === 'completed').length
  const total = sessions.length
  const rate = total > 0 ? Math.round((completed / total) * 100) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {total > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Sesiones (30d)', value: total },
            { label: 'Completadas', value: completed },
            { label: 'Cumplimiento', value: rate !== null ? `${rate}%` : 'Sin datos' },
          ].map(k => (
            <div key={k.label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{k.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>Últimas sesiones (30 días)</h3>
        </div>

        {isLoading ? (
          <div style={{ padding: 24, color: 'var(--color-text-3)' }}>Cargando...</div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-3)', fontSize: 14 }}>
            Sin sesiones en los últimos 30 días.
          </div>
        ) : (
          <div>
            {sessions.map((s, i) => {
              const content = (s as any).routine?.name ?? (s as any).wod?.name ?? (s.type === 'rest' ? 'Descanso' : 'Evento')
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: i < sessions.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s.status], flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>{content}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                      {new Date(s.scheduled_date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {s.scheduled_time ? ` · ${s.scheduled_time.substring(0, 5)}` : ''}
                    </p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: STATUS_COLORS[s.status], background: STATUS_COLORS[s.status] + '18', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
                    {STATUS_LABELS[s.status]}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function MedicionesTab({ athleteId }: { athleteId: string }) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ measured_at: new Date().toISOString().split('T')[0], weight_kg: '', height_cm: '', body_fat_pct: '', muscle_mass_kg: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const { data: measurements = [], isLoading } = useQuery({
    queryKey: ['measurements', athleteId],
    queryFn: () => getMeasurements(athleteId),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMeasurement,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['measurements', athleteId] }),
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await addMeasurement({
      athlete_id: athleteId,
      measured_at: form.measured_at,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      height_cm: form.height_cm ? Number(form.height_cm) : undefined,
      body_fat_pct: form.body_fat_pct ? Number(form.body_fat_pct) : undefined,
      muscle_mass_kg: form.muscle_mass_kg ? Number(form.muscle_mass_kg) : undefined,
      notes: form.notes || undefined,
    })
    qc.invalidateQueries({ queryKey: ['measurements', athleteId] })
    setShowForm(false)
    setForm({ measured_at: new Date().toISOString().split('T')[0], weight_kg: '', height_cm: '', body_fat_pct: '', muscle_mass_kg: '', notes: '' })
    setSaving(false)
  }

  const latest = measurements[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {latest && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Peso', value: latest.weight_kg ? `${latest.weight_kg} kg` : null },
            { label: 'Estatura', value: latest.height_cm ? `${latest.height_cm} cm` : null },
            { label: '% Grasa', value: latest.body_fat_pct ? `${latest.body_fat_pct}%` : null },
            { label: 'Masa muscular', value: latest.muscle_mass_kg ? `${latest.muscle_mass_kg} kg` : null },
          ].filter(k => k.value).map(k => (
            <div key={k.label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{k.label}</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>Historial de mediciones</h3>
          <button onClick={() => setShowForm(!showForm)} style={{ fontSize: 13, color: 'var(--color-red)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
            {showForm ? 'Cancelar' : '+ Nueva medición'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <MField label="Fecha" type="date" value={form.measured_at} onChange={v => setForm(p => ({ ...p, measured_at: v }))} required />
              <MField label="Peso (kg)" type="number" value={form.weight_kg} onChange={v => setForm(p => ({ ...p, weight_kg: v }))} />
              <MField label="Estatura (cm)" type="number" value={form.height_cm} onChange={v => setForm(p => ({ ...p, height_cm: v }))} />
              <MField label="% Grasa corporal" type="number" value={form.body_fat_pct} onChange={v => setForm(p => ({ ...p, body_fat_pct: v }))} />
              <MField label="Masa muscular (kg)" type="number" value={form.muscle_mass_kg} onChange={v => setForm(p => ({ ...p, muscle_mass_kg: v }))} />
            </div>
            <MField label="Notas" value={form.notes} onChange={v => setForm(p => ({ ...p, notes: v }))} />
            <div>
              <button type="submit" disabled={saving} style={{ padding: '8px 20px', background: 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Guardando...' : 'Guardar medición'}
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div style={{ padding: 24, color: 'var(--color-text-3)' }}>Cargando...</div>
        ) : measurements.length === 0 && !showForm ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-3)', fontSize: 14 }}>
            Sin mediciones registradas.
          </div>
        ) : (
          <div>
            {measurements.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderBottom: i < measurements.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <div style={{ width: 80, flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>
                    {new Date(m.measured_at + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ flex: 1, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {m.weight_kg && <Chip label="Peso" value={`${m.weight_kg} kg`} />}
                  {m.body_fat_pct && <Chip label="Grasa" value={`${m.body_fat_pct}%`} />}
                  {m.muscle_mass_kg && <Chip label="Músculo" value={`${m.muscle_mass_kg} kg`} />}
                  {m.bmi && <Chip label="IMC" value={String(m.bmi)} />}
                </div>
                <button onClick={() => { if (confirm('¿Eliminar esta medición?')) deleteMutation.mutate(m.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-4)', fontSize: 14, padding: 4 }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MField({ label, value, onChange, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--color-text-3)', marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }} />
    </div>
  )
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>{value}</p>
    </div>
  )
}
