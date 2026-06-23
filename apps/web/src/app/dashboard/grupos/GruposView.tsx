'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getGroups, createGroup, deleteGroup,
  type GroupRow,
} from '@/lib/queries/team'
import { useUser } from '@/hooks/useUser'
import { UsersRound, Clock, Plus, Trash2, Globe, Lock } from 'lucide-react'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const GROUP_TYPES = [
  { value: 'class',   label: 'Clase' },
  { value: 'program', label: 'Programa' },
  { value: 'team',    label: 'Equipo' },
]
const SPORTS = ['CrossFit', 'Hyrox', 'Fuerza', 'Halterofilia', 'Cardio', 'Funcional', 'Yoga', 'Pilates', 'Boxeo', 'Natación', 'Otro']

type NewGroup = {
  name: string
  description: string
  type: 'class' | 'program' | 'team'
  day_of_week: number[]
  start_time: string
  end_time: string
  max_capacity: string
  is_global: boolean
  sport: string
}

const DEFAULT_FORM: NewGroup = {
  name: '', description: '', type: 'class',
  day_of_week: [], start_time: '', end_time: '',
  max_capacity: '', is_global: false, sport: '',
}

export function GruposView() {
  const { isCoach, isSuperAdmin, isPlatformAdmin, canCreateGlobalClasses } = useUser()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NewGroup>(DEFAULT_FORM)
  const [filterGlobal, setFilterGlobal] = useState<'all' | 'global' | 'mine'>('all')
  const [formError, setFormError] = useState('')

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: getGroups,
  })

  const create = useMutation({
    mutationFn: (g: NewGroup) => createGroup({
      name: g.name,
      description: g.description || undefined,
      type: g.type,
      day_of_week: g.day_of_week,
      start_time: g.start_time || undefined,
      end_time: g.end_time || undefined,
      max_capacity: g.max_capacity ? parseInt(g.max_capacity) : undefined,
      is_global: g.is_global,
      sport: g.sport || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] })
      setShowForm(false)
      setForm(DEFAULT_FORM)
      setFormError('')
    },
    onError: (err: Error) => setFormError(err.message),
  })

  const remove = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  })

  const filtered = groups.filter(g => {
    if (filterGlobal === 'global') return g.is_global
    if (filterGlobal === 'mine') return !g.is_global
    return true
  })

  const handleDayToggle = (day: number) => {
    setForm(f => ({
      ...f,
      day_of_week: f.day_of_week.includes(day)
        ? f.day_of_week.filter(d => d !== day)
        : [...f.day_of_week, day].sort(),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('El nombre es requerido'); return }
    setFormError('')
    create.mutate(form)
  }

  const canGlobal = isSuperAdmin || isPlatformAdmin

  const s = {
    page:     { maxWidth: 1100 },
    header:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
    title:    { fontSize: 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' },
    sub:      { fontSize: 14, color: 'var(--color-text-3)', marginTop: 4 },
    tabs:     { display: 'flex', gap: 6, marginBottom: 20 },
    tab:      (active: boolean) => ({
      padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: 'none',
      fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
      background: active ? 'var(--color-red)' : 'var(--color-surface)',
      color: active ? '#fff' : 'var(--color-text-2)',
    }),
    grid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
    card:     { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px', position: 'relative' as const },
    cardHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
    name:     { fontSize: 15, fontWeight: 600, color: 'var(--color-text)' },
    type:     { fontSize: 11, color: 'var(--color-text-3)', marginTop: 2 },
    chips:    { display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginBottom: 12 },
    chip:     (active: boolean) => ({
      padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: active ? 'rgba(99,102,241,0.15)' : 'var(--color-border)',
      color: active ? 'var(--color-red)' : 'var(--color-text-3)',
    }),
    meta:     { display: 'flex', gap: 14, alignItems: 'center' },
    metaItem: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-text-3)' },
    formCard: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 24 },
    label:    { fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 6, display: 'block' },
    input:    { width: '100%', height: 40, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)', padding: '0 12px', fontSize: 14, boxSizing: 'border-box' as const },
    select:   { width: '100%', height: 40, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)', padding: '0 12px', fontSize: 14 },
    twoCol:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    btnPrimary: { background: 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    btnSecondary: { background: 'none', color: 'var(--color-text-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '9px 16px', fontSize: 14, cursor: 'pointer' },
    dayBtn:   (active: boolean) => ({
      width: 34, height: 34, borderRadius: 999, border: 'none', cursor: 'pointer',
      fontSize: 11, fontWeight: 600,
      background: active ? 'var(--color-red)' : 'var(--color-border)',
      color: active ? '#fff' : 'var(--color-text-3)',
    }),
    toggle:   (on: boolean) => ({
      width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: on ? 'var(--color-red)' : 'var(--color-border)',
      position: 'relative' as const, transition: 'background 0.2s', flexShrink: 0,
    }),
    toggleKnob: (on: boolean) => ({
      position: 'absolute' as const, top: 3, left: on ? 21 : 3,
      width: 18, height: 18, borderRadius: '50%', background: 'var(--color-surface)',
      transition: 'left 0.2s',
    }),
  }

  return (
    <div className="eb-page" style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Grupos de entrenamiento</h1>
          <p style={s.sub}>Organiza clases, programas y equipos con horarios</p>
        </div>
        {!showForm && (isCoach || isSuperAdmin) && (
          <button style={s.btnPrimary} onClick={() => setShowForm(true)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Plus size={15} /> Nuevo grupo
            </span>
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div style={s.formCard}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18, color: 'var(--color-text)' }}>Nuevo grupo</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ ...s.twoCol, marginBottom: 16 }}>
              <div>
                <label style={s.label}>Nombre *</label>
                <input style={s.input} placeholder="ej. CrossFit 7am" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>Tipo</label>
                <select style={s.select} value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as NewGroup['type'] }))}>
                  {GROUP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Descripción</label>
              <input style={s.input} placeholder="Descripción opcional" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            {/* Days */}
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Días de la semana</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {DAYS.map((d, i) => (
                  <button key={i} type="button" style={s.dayBtn(form.day_of_week.includes(i))}
                    onClick={() => handleDayToggle(i)}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ ...s.twoCol, marginBottom: 16 }}>
              <div>
                <label style={s.label}>Hora inicio</label>
                <input style={s.input} type="time" value={form.start_time}
                  onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div>
                <label style={s.label}>Hora fin</label>
                <input style={s.input} type="time" value={form.end_time}
                  onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
              </div>
            </div>

            <div style={{ ...s.twoCol, marginBottom: 16 }}>
              <div>
                <label style={s.label}>Deporte</label>
                <select style={s.select} value={form.sport}
                  onChange={e => setForm(f => ({ ...f, sport: e.target.value }))}>
                  <option value="">"” Sin especificar "”</option>
                  {SPORTS.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Capacidad máxima</label>
                <input style={s.input} type="number" min="1" max="200" placeholder="ej. 20"
                  value={form.max_capacity}
                  onChange={e => setForm(f => ({ ...f, max_capacity: e.target.value }))} />
              </div>
            </div>

            {canGlobal && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '14px 16px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <button type="button" style={s.toggle(form.is_global)}
                  onClick={() => setForm(f => ({ ...f, is_global: !f.is_global }))}>
                  <span style={s.toggleKnob(form.is_global)} />
                </button>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Clase global del gimnasio</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                    Visible para todos los atletas del gym, no asignada a un coach específico
                  </div>
                </div>
                <Globe size={18} style={{ color: form.is_global ? 'var(--color-red)' : 'var(--color-text-3)', marginLeft: 'auto' }} />
              </div>
            )}

            {formError && (
              <p style={{ color: 'var(--color-danger, #e53935)', fontSize: 13, marginBottom: 12 }}>{formError}</p>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" style={s.btnPrimary} disabled={create.isPending}>
                {create.isPending ? 'Creando...' : 'Crear grupo'}
              </button>
              <button type="button" style={s.btnSecondary}
                onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); setFormError('') }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div style={s.tabs}>
        {([
          { key: 'all', label: `Todos (${groups.length})` },
          { key: 'global', label: `Globales (${groups.filter(g => g.is_global).length})` },
          { key: 'mine', label: `Mis grupos (${groups.filter(g => !g.is_global).length})` },
        ] as { key: typeof filterGlobal; label: string }[]).map(t => (
          <button key={t.key} style={s.tab(filterGlobal === t.key)} onClick={() => setFilterGlobal(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-3)' }}>Cargando grupos...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <UsersRound size={36} style={{ color: 'var(--color-text-3)', marginBottom: 12 }} />
          <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>No hay grupos aún. Crea el primero.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map(g => (
            <div key={g.id} style={s.card}>
              {/* Header */}
              <div style={s.cardHead}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={s.name}>{g.name}</span>
                    {g.is_global
                      ? <span title="Clase global"><Globe size={13} style={{ color: '#4caf50' }} /></span>
                      : <span title="Grupo privado"><Lock size={13} style={{ color: 'var(--color-text-3)' }} /></span>}
                  </div>
                  <div style={s.type}>
                    {GROUP_TYPES.find(t => t.value === g.type)?.label ?? g.type}
                    {g.sport && ` Â· ${g.sport}`}
                  </div>
                </div>
                <button
                  onClick={() => remove.mutate(g.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)', padding: 4 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Days chips */}
              {g.day_of_week.length > 0 && (
                <div style={s.chips}>
                  {DAYS.map((d, i) => (
                    <span key={i} style={s.chip(g.day_of_week.includes(i))}>{d}</span>
                  ))}
                </div>
              )}

              {g.description && (
                <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', marginBottom: 12 }}>{g.description}</p>
              )}

              {/* Meta */}
              <div style={s.meta}>
                {(g.start_time || g.end_time) && (
                  <span style={s.metaItem}>
                    <Clock size={12} />
                    {g.start_time && g.end_time ? `${g.start_time.slice(0,5)} "“ ${g.end_time.slice(0,5)}` : g.start_time?.slice(0,5) ?? g.end_time?.slice(0,5)}
                  </span>
                )}
                <span style={s.metaItem}>
                  <UsersRound size={12} />
                  {g.athlete_count ?? 0}{g.max_capacity ? ` / ${g.max_capacity}` : ''} atletas
                </span>
                {g.coach_name && !g.is_global && (
                  <span style={s.metaItem} title="Coach">
                    ðŸŽ¯ {g.coach_name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
