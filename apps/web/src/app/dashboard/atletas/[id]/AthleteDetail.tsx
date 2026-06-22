'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAthlete, updateAthlete } from '@/lib/queries/athletes'
import { getSessionsByAthlete } from '@/lib/queries/sessions'
import { getMeasurements, addMeasurement, deleteMeasurement } from '@/lib/queries/measurements'
import { getLatestPRs } from '@/lib/queries/prs'
import { getAthleteWodResults, SCALE_LABELS, SCALE_COLORS, buildResultText } from '@/lib/queries/wod-results'
import type { Athlete } from '@entrebarras/types'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Calendar, CheckCircle2, Trash2, Plus, Scale, Ruler, Activity, Percent, Trophy, Dumbbell } from 'lucide-react'

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado', competitive: 'Competitivo',
}
const GENDER_LABELS: Record<string, string> = {
  male: 'Masculino', female: 'Femenino', other: 'Otro', prefer_not_to_say: 'Prefiero no decir',
}
const STATUS_ATHLETE_LABELS: Record<string, string> = {
  active: 'Activo', inactive: 'Inactivo', prospect: 'Prospecto',
}
const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  beginner:     { bg: '#F0FDF4', text: '#16A34A' },
  intermediate: { bg: '#EFF6FF', text: '#1D4ED8' },
  advanced:     { bg: '#FFF7ED', text: '#C2410C' },
  competitive:  { bg: '#FDF2F8', text: '#9D174D' },
}
const STATUS_DOT: Record<string, string> = {
  scheduled: '#3B82F6', started: '#F59E0B', completed: '#16A34A', skipped: '#CBD5E1',
}
const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Programado', started: 'En curso', completed: 'Completado', skipped: 'Saltado',
}
const STATUS_BG: Record<string, string> = {
  scheduled: '#EFF6FF', started: '#FFFBEB', completed: '#F0FDF4', skipped: '#F8FAFC',
}
const STATUS_TEXT: Record<string, string> = {
  scheduled: '#1D4ED8', started: '#B45309', completed: '#16A34A', skipped: '#94A3B8',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px',
  border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13.5,
  color: '#0F172A', background: '#fff', boxSizing: 'border-box',
  outline: 'none',
}

export function AthleteDetail({ athleteId }: { athleteId: string }) {
  const [tab, setTab] = useState<'perfil' | 'sesiones' | 'mediciones' | 'prs' | 'wods'>('perfil')

  const { data: athlete, isLoading } = useQuery({
    queryKey: ['athlete', athleteId],
    queryFn: () => getAthlete(athleteId),
  })

  if (isLoading) return <div style={{ padding: 48, color: '#94A3B8', fontSize: 14 }}>Cargando...</div>
  if (!athlete) return <div style={{ padding: 48, color: '#EF4444', fontSize: 14 }}>Atleta no encontrado</div>

  const initials = `${athlete.first_name[0]}${athlete.last_name[0]}`.toUpperCase()
  const age = athlete.date_of_birth
    ? Math.floor((Date.now() - new Date(athlete.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null
  const lc = athlete.sport_level ? LEVEL_COLORS[athlete.sport_level] : null

  const tabs = [
    { id: 'perfil' as const,     label: 'Perfil' },
    { id: 'sesiones' as const,   label: 'Historial' },
    { id: 'mediciones' as const, label: 'Mediciones' },
    { id: 'prs' as const,        label: 'PRs' },
    { id: 'wods' as const,       label: 'WODs' },
  ]

  return (
    <div style={{ padding: '36px 40px', maxWidth: 860 }}>
      {/* Back */}
      <Link href="/dashboard/atletas" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: '#64748B', textDecoration: 'none',
        fontWeight: 500, marginBottom: 24,
      }}>
        <ArrowLeft size={15} />
        Volver a Atletas
      </Link>

      {/* Athlete header */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0',
        borderRadius: 16, padding: '24px 28px', marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'flex-start', gap: 20,
      }}>
        {/* Avatar */}
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'linear-gradient(135deg, #E53E3E 0%, #B91C1C 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 800, color: '#fff', flexShrink: 0,
          letterSpacing: '-0.02em',
        }}>
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.04em' }}>
              {athlete.first_name} {athlete.last_name}
            </h1>
            {athlete.sport_level && lc && (
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                textTransform: 'uppercase', padding: '3px 9px',
                borderRadius: 20, background: lc.bg, color: lc.text,
              }}>
                {LEVEL_LABELS[athlete.sport_level]}
              </span>
            )}
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
              textTransform: 'uppercase', padding: '3px 9px',
              borderRadius: 20,
              background: athlete.status === 'active' ? '#F0FDF4' : '#F8FAFC',
              color: athlete.status === 'active' ? '#16A34A' : '#94A3B8',
            }}>
              {athlete.status === 'active' ? 'Activo' : athlete.status === 'inactive' ? 'Inactivo' : 'Prospecto'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {athlete.email && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#64748B' }}>
                <Mail size={13} />
                {athlete.email}
              </span>
            )}
            {athlete.phone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#64748B' }}>
                <Phone size={13} />
                {athlete.phone}
              </span>
            )}
            {age && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#64748B' }}>
                <Calendar size={13} />
                {age} años
              </span>
            )}
            {athlete.primary_sport && (
              <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                {athlete.primary_sport}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 18px', border: 'none', cursor: 'pointer',
              borderRadius: 8, fontSize: 13.5, fontWeight: 600,
              transition: 'all 0.14s',
              background: tab === t.id ? '#0F172A' : 'transparent',
              color: tab === t.id ? '#fff' : '#64748B',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'perfil'     && <PerfilTab athlete={athlete} />}
      {tab === 'sesiones'   && <SesionesTab athleteId={athleteId} />}
      {tab === 'mediciones' && <MedicionesTab athleteId={athleteId} />}
      {tab === 'prs'        && <PRsTab athleteId={athleteId} />}
      {tab === 'wods'       && <WodResultsTab athleteId={athleteId} />}
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
      setSaved(true); setEditing(false)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  type FieldOption = { value: string; label: string }
  type FieldDef = { label: string; key: string; type: string; options?: FieldOption[] }

  const groups: { group: string; cols: number; items: FieldDef[] }[] = [
    { group: 'Información personal', cols: 2, items: [
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
    { group: 'Perfil deportivo', cols: 3, items: [
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
      { label: 'Peso (kg)', key: 'weight_kg', type: 'number' },
      { label: 'Estatura (cm)', key: 'height_cm', type: 'number' },
    ]},
  ]

  const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none' as const }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {groups.map(group => (
        <div key={group.group} style={{
          background: '#fff', border: '1px solid #E2E8F0',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #F1F5F9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {group.group}
            </h3>
            {!editing && group.group === 'Información personal' && (
              <button
                onClick={() => setEditing(true)}
                style={{ fontSize: 13, fontWeight: 600, color: '#E53E3E', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Editar
              </button>
            )}
          </div>
          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: `repeat(${group.cols}, 1fr)`, gap: 16 }}>
            {group.items.map(field => (
              <div key={field.key}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                  {field.label}
                </p>
                {editing ? (
                  field.type === 'select' ? (
                    <select
                      value={(form as any)[field.key]}
                      onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                      style={selectStyle}
                    >
                      {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={(form as any)[field.key]}
                      onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                      style={inputStyle}
                    />
                  )
                ) : (
                  <p style={{ fontSize: 14, fontWeight: 500, color: (form as any)[field.key] ? '#0F172A' : '#CBD5E1' }}>
                    {field.key === 'gender' ? (GENDER_LABELS[(form as any)[field.key]] || '—')
                     : field.key === 'sport_level' ? (LEVEL_LABELS[(form as any)[field.key]] || '—')
                     : field.key === 'status' ? (STATUS_ATHLETE_LABELS[(form as any)[field.key]] || '—')
                     : ((form as any)[field.key] || '—')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Medical notes */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Notas médicas
          </h3>
        </div>
        <div style={{ padding: '16px 20px' }}>
          {editing ? (
            <textarea
              value={form.medical_notes}
              onChange={e => setForm(p => ({ ...p, medical_notes: e.target.value }))}
              rows={3}
              placeholder="Lesiones previas, alergias, condiciones especiales..."
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          ) : (
            <p style={{ fontSize: 14, color: form.medical_notes ? '#0F172A' : '#CBD5E1', lineHeight: 1.6 }}>
              {form.medical_notes || 'Sin notas médicas'}
            </p>
          )}
        </div>
      </div>

      {editing && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setEditing(false)}
            style={{
              padding: '9px 20px', border: '1px solid #E2E8F0',
              borderRadius: 9, fontSize: 13.5, cursor: 'pointer',
              background: '#fff', color: '#64748B', fontWeight: 500,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            style={{
              padding: '9px 22px',
              background: saved ? '#16A34A' : '#E53E3E',
              color: '#fff', border: 'none', borderRadius: 9,
              fontSize: 13.5, fontWeight: 700, cursor: mutation.isPending ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {mutation.isPending ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar cambios'}
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

  const kpis = [
    { period: 'ÚLTIMOS 30 DÍAS', value: total, label: 'Sesiones totales', color: '#0F172A' },
    { period: 'COMPLETADAS', value: completed, label: 'Con éxito', color: '#16A34A' },
    { period: 'CUMPLIMIENTO', value: rate !== null ? `${rate}%` : '—', label: 'Tasa de asistencia', color: rate === null ? '#94A3B8' : rate >= 75 ? '#16A34A' : rate >= 50 ? '#F59E0B' : '#E53E3E' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {kpis.map(k => (
          <div key={k.period} style={{
            background: '#fff', border: '1px solid #E2E8F0',
            borderRadius: 14, padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {k.period}
            </p>
            <p style={{ fontSize: 36, fontWeight: 800, color: k.color, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {k.value}
            </p>
            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Sessions list */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Últimas 30 días
          </span>
        </div>

        {isLoading ? (
          <div style={{ padding: 32, color: '#94A3B8', fontSize: 14 }}>Cargando...</div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <CheckCircle2 size={28} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
            <p style={{ fontSize: 14, color: '#94A3B8' }}>Sin sesiones en los últimos 30 días.</p>
          </div>
        ) : (
          sessions.map((s, i) => {
            const content = (s as any).routine?.name ?? (s as any).wod?.name ?? (s.type === 'rest' ? 'Descanso' : 'Evento')
            return (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px',
                borderBottom: i < sessions.length - 1 ? '1px solid #F8FAFC' : 'none',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: STATUS_DOT[s.status], flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{content}</p>
                  <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>
                    {new Date(s.scheduled_date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {s.scheduled_time ? ` · ${s.scheduled_time.substring(0, 5)}` : ''}
                  </p>
                </div>
                <span style={{
                  fontSize: 11.5, fontWeight: 600, padding: '4px 10px',
                  borderRadius: 20,
                  background: STATUS_BG[s.status] ?? '#F8FAFC',
                  color: STATUS_TEXT[s.status] ?? '#94A3B8',
                }}>
                  {STATUS_LABELS[s.status]}
                </span>
              </div>
            )
          })
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
    e.preventDefault(); setSaving(true)
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
  const statCards = latest ? [
    { icon: <Scale size={16} />, label: 'Peso', value: latest.weight_kg ? `${latest.weight_kg}` : null, unit: 'kg' },
    { icon: <Ruler size={16} />, label: 'Estatura', value: latest.height_cm ? `${latest.height_cm}` : null, unit: 'cm' },
    { icon: <Percent size={16} />, label: 'Grasa corporal', value: latest.body_fat_pct ? `${latest.body_fat_pct}` : null, unit: '%' },
    { icon: <Activity size={16} />, label: 'Masa muscular', value: latest.muscle_mass_kg ? `${latest.muscle_mass_kg}` : null, unit: 'kg' },
  ].filter(k => k.value) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Latest measurement stats */}
      {statCards.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${statCards.length}, 1fr)`, gap: 12 }}>
          {statCards.map(k => (
            <div key={k.label} style={{
              background: '#fff', border: '1px solid #E2E8F0',
              borderRadius: 14, padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ color: '#CBD5E1' }}>{k.icon}</span>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</p>
              </div>
              <p style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {k.value}
                <span style={{ fontSize: 14, fontWeight: 500, color: '#94A3B8', marginLeft: 3 }}>{k.unit}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Measurements list */}
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #F1F5F9',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Historial de mediciones
          </span>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 13, fontWeight: 600, color: '#E53E3E',
              background: '#FFF5F5', border: '1px solid #FED7D7',
              borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
            }}
          >
            {showForm ? 'Cancelar' : <><Plus size={13} /> Nueva medición</>}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Nueva medición
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
              {[
                { label: 'Fecha *', key: 'measured_at', type: 'date', required: true },
                { label: 'Peso (kg)', key: 'weight_kg', type: 'number' },
                { label: 'Estatura (cm)', key: 'height_cm', type: 'number' },
                { label: '% Grasa', key: 'body_fat_pct', type: 'number' },
                { label: 'Masa muscular (kg)', key: 'muscle_mass_kg', type: 'number' },
                { label: 'Notas', key: 'notes', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#64748B', marginBottom: 4 }}>{f.label}</label>
                  <input
                    type={f.type}
                    required={f.required}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 18px', background: '#E53E3E', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Guardando...' : 'Guardar medición'}
            </button>
          </form>
        )}

        {isLoading ? (
          <div style={{ padding: 32, color: '#94A3B8', fontSize: 14 }}>Cargando...</div>
        ) : measurements.length === 0 && !showForm ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Scale size={28} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Sin mediciones</p>
            <p style={{ fontSize: 13, color: '#94A3B8' }}>Registra el peso y composición corporal del atleta.</p>
          </div>
        ) : (
          measurements.map((m, i) => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '13px 20px',
              borderBottom: i < measurements.length - 1 ? '1px solid #F8FAFC' : 'none',
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#475569', minWidth: 90, flexShrink: 0 }}>
                {new Date(m.measured_at + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <div style={{ flex: 1, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {m.weight_kg && <StatVal label="Peso" value={`${m.weight_kg} kg`} />}
                {m.body_fat_pct && <StatVal label="Grasa" value={`${m.body_fat_pct}%`} />}
                {m.muscle_mass_kg && <StatVal label="Músculo" value={`${m.muscle_mass_kg} kg`} />}
                {(m as any).bmi && <StatVal label="IMC" value={String((m as any).bmi)} />}
              </div>
              <button
                onClick={() => { if (confirm('¿Eliminar esta medición?')) deleteMutation.mutate(m.id) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 4, display: 'flex', alignItems: 'center' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StatVal({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{value}</p>
    </div>
  )
}

function PRsTab({ athleteId }: { athleteId: string }) {
  const { data: prs = [], isLoading } = useQuery({
    queryKey: ['athlete-prs', athleteId],
    queryFn: () => getLatestPRs(athleteId),
  })

  if (isLoading) return <div style={{ padding: 40, color: '#94A3B8', fontSize: 14 }}>Cargando PRs...</div>

  if (prs.length === 0) return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14,
      padding: '48px 24px', textAlign: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFF5F5', border: '1px solid #FED7D7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
        <Dumbbell size={20} color="#E53E3E" />
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Sin récords personales</p>
      <p style={{ fontSize: 13, color: '#94A3B8' }}>Los PRs se registran desde la Calculadora de %.</p>
    </div>
  )

  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Dumbbell size={14} color="#E53E3E" />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Récords personales
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, background: '#F1F5F9', color: '#475569', borderRadius: 20, padding: '2px 8px' }}>
          {prs.length}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 0 }}>
        {prs.map((pr, i) => (
          <div key={pr.id} style={{
            padding: '16px 20px',
            borderRight: '1px solid #F1F5F9',
            borderBottom: '1px solid #F1F5F9',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              {pr.movement_name}
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {pr.estimated_1rm ?? pr.weight_kg}
              <span style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8', marginLeft: 3 }}>kg</span>
            </p>
            {pr.estimated_1rm && pr.reps > 1 && (
              <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                {pr.weight_kg}kg × {pr.reps} reps (estimado)
              </p>
            )}
            <p style={{ fontSize: 11, color: '#CBD5E1', marginTop: 4 }}>
              {new Date(pr.recorded_at + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function WodResultsTab({ athleteId }: { athleteId: string }) {
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['athlete-wod-results', athleteId],
    queryFn: () => getAthleteWodResults(athleteId, 30),
  })

  if (isLoading) return <div style={{ padding: 40, color: '#94A3B8', fontSize: 14 }}>Cargando resultados...</div>

  if (results.length === 0) return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14,
      padding: '48px 24px', textAlign: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFF7ED', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
        <Trophy size={20} color="#F97316" />
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Sin resultados de WODs</p>
      <p style={{ fontSize: 13, color: '#94A3B8' }}>Los resultados se guardan desde el timer del WOD.</p>
    </div>
  )

  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Trophy size={14} color="#F97316" />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Resultados de WODs
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, background: '#F1F5F9', color: '#475569', borderRadius: 20, padding: '2px 8px' }}>
          {results.length}
        </span>
      </div>
      {results.map((r, i) => {
        const sc = SCALE_COLORS[r.scale]
        const display = buildResultText(r)
        return (
          <div key={r.id} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px',
            borderBottom: i < results.length - 1 ? '1px solid #F8FAFC' : 'none',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
                {(r as any).wod_name ?? 'WOD'}
              </p>
              {r.notes && (
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{r.notes}</p>
              )}
            </div>
            {display && (
              <p style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {display}
              </p>
            )}
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, border: `1px solid ${sc.border}`, background: sc.bg, color: sc.text, flexShrink: 0 }}>
              {SCALE_LABELS[r.scale]}
            </span>
            <p style={{ fontSize: 11, color: '#CBD5E1', flexShrink: 0, minWidth: 60, textAlign: 'right' }}>
              {new Date(r.recorded_at + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        )
      })}
    </div>
  )
}
