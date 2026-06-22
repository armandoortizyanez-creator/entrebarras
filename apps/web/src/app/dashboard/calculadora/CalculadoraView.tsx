'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAthletes } from '@/lib/queries/athletes'
import { getLatestPRs, getPRHistory, savePR, deletePR, epley1RM, percentageTable } from '@/lib/queries/prs'
import type { PersonalRecord } from '@/lib/queries/prs'
import { useUser } from '@/hooks/useUser'
import { Plus, Trash2, ChevronDown, ChevronUp, Calculator, Trophy, X } from 'lucide-react'

const COMMON_MOVEMENTS = [
  'Back Squat', 'Front Squat', 'Overhead Squat',
  'Deadlift', 'Romanian Deadlift', 'Sumo Deadlift',
  'Clean', 'Power Clean', 'Clean & Jerk',
  'Snatch', 'Power Snatch',
  'Strict Press', 'Push Press', 'Push Jerk', 'Split Jerk',
  'Bench Press', 'Thruster',
]

const PCT_ZONE: Record<number, { bg: string; text: string; label: string }> = {
  50:  { bg: '#F0FDF4', text: '#15803D', label: 'Calentamiento' },
  55:  { bg: '#F0FDF4', text: '#15803D', label: '' },
  60:  { bg: '#F0FDF4', text: '#15803D', label: '' },
  65:  { bg: '#FFFBEB', text: '#B45309', label: 'Técnica' },
  70:  { bg: '#FFFBEB', text: '#B45309', label: '' },
  75:  { bg: '#FFFBEB', text: '#B45309', label: '' },
  80:  { bg: '#FFF7ED', text: '#C2410C', label: 'Fuerza' },
  85:  { bg: '#FFF7ED', text: '#C2410C', label: '' },
  90:  { bg: '#FEF2F2', text: '#B91C1C', label: 'Intensidad' },
  95:  { bg: '#FEF2F2', text: '#B91C1C', label: '' },
  100: { bg: '#FFF5F5', text: '#E53E3E', label: '1RM' },
  105: { bg: '#F5F3FF', text: '#6D28D9', label: 'Objetivo' },
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px',
  border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13.5,
  color: '#0F172A', background: '#fff', boxSizing: 'border-box', outline: 'none',
}

export function CalculadoraView() {
  const { role, isAthlete } = useUser()
  const qc = useQueryClient()

  // Athlete selection (coaches see all; athletes see themselves)
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null)

  // Calculator state
  const [selectedMovement, setSelectedMovement] = useState<string>('Back Squat')
  const [customMovement, setCustomMovement] = useState('')
  const [calcWeight, setCalcWeight] = useState('')
  const [calcReps, setCalcReps] = useState('1')
  const [manualOneRM, setManualOneRM] = useState('')

  // History drawer
  const [historyMovement, setHistoryMovement] = useState<string | null>(null)

  // Add PR modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    movement_name: '',
    weight_kg: '',
    reps: '1',
    recorded_at: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const movementName = customMovement.trim() || selectedMovement

  // Load athletes (coaches/admins only)
  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes'],
    queryFn: () => getAthletes(),
    enabled: !isAthlete,
  })

  // Load current user's athlete ID for athlete role
  const { data: selfPRs } = useQuery({
    queryKey: ['prs', 'self'],
    queryFn: async () => {
      // For athlete role we fetch by matching auth user later — for now use first found
      return [] as PersonalRecord[]
    },
    enabled: isAthlete,
  })

  // PRs for selected athlete
  const effectiveAthleteId = selectedAthleteId
  const { data: prs = [], isLoading: prsLoading } = useQuery({
    queryKey: ['prs', effectiveAthleteId],
    queryFn: () => getLatestPRs(effectiveAthleteId!),
    enabled: !!effectiveAthleteId,
  })

  // History for a specific movement
  const { data: history = [] } = useQuery({
    queryKey: ['prs-history', effectiveAthleteId, historyMovement],
    queryFn: () => getPRHistory(effectiveAthleteId!, historyMovement!),
    enabled: !!effectiveAthleteId && !!historyMovement,
  })

  const saveMutation = useMutation({
    mutationFn: savePR,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prs', effectiveAthleteId] })
      qc.invalidateQueries({ queryKey: ['prs-history', effectiveAthleteId] })
      setShowAddModal(false)
      setAddForm({ movement_name: '', weight_kg: '', reps: '1', recorded_at: new Date().toISOString().split('T')[0], notes: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePR,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prs', effectiveAthleteId] })
      qc.invalidateQueries({ queryKey: ['prs-history', effectiveAthleteId] })
    },
  })

  // Calculator logic
  const w = parseFloat(calcWeight)
  const r = parseInt(calcReps)
  const manualRM = parseFloat(manualOneRM)

  const estimated = !isNaN(w) && !isNaN(r) && w > 0 && r > 0 ? epley1RM(w, r) : null
  const oneRM = !isNaN(manualRM) && manualRM > 0
    ? manualRM
    : estimated ?? (prs.find(p => p.movement_name === movementName)?.estimated_1rm
      ?? prs.find(p => p.movement_name === movementName)?.weight_kg ?? null)

  const table = oneRM ? percentageTable(oneRM) : null

  // When selecting a movement, auto-fill 1RM from saved PRs
  useEffect(() => {
    const saved = prs.find(p => p.movement_name === movementName)
    if (saved && !manualOneRM) {
      const val = saved.estimated_1rm ?? saved.weight_kg
      setManualOneRM(String(val))
    }
  }, [movementName, prs])

  function openAdd(movement?: string) {
    setAddForm(f => ({
      ...f,
      movement_name: movement || movementName,
    }))
    setShowAddModal(true)
  }

  async function handleSavePR(e: React.FormEvent) {
    e.preventDefault()
    if (!effectiveAthleteId || !addForm.movement_name || !addForm.weight_kg) return
    await saveMutation.mutateAsync({
      athlete_id: effectiveAthleteId,
      movement_name: addForm.movement_name.trim(),
      weight_kg: parseFloat(addForm.weight_kg),
      reps: parseInt(addForm.reps) || 1,
      recorded_at: addForm.recorded_at,
      notes: addForm.notes || undefined,
    })
  }

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId)

  return (
    <div style={{ padding: '36px 40px', maxWidth: 1100 }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.04em' }}>
            Calculadora de % y PRs
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>
            Máximos por movimiento y tabla de porcentajes para programar cargas
          </p>
        </div>

        {effectiveAthleteId && (
          <button
            onClick={() => openAdd()}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#E53E3E', color: '#fff', border: 'none',
              borderRadius: 10, padding: '9px 18px',
              fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Plus size={15} />
            Registrar PR
          </button>
        )}
      </div>

      {/* Athlete selector (coaches only) */}
      {!isAthlete && (
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0',
          borderRadius: 14, padding: '16px 20px', marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Seleccionar atleta
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {athletes.map(a => (
              <button
                key={a.id}
                onClick={() => {
                  setSelectedAthleteId(a.id)
                  setManualOneRM('')
                }}
                style={{
                  padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedAthleteId === a.id ? '#E53E3E' : '#E2E8F0',
                  background: selectedAthleteId === a.id ? '#FFF5F5' : '#F8FAFC',
                  color: selectedAthleteId === a.id ? '#E53E3E' : '#475569',
                  transition: 'all 0.12s',
                }}
              >
                {a.first_name} {a.last_name}
              </button>
            ))}
            {athletes.length === 0 && (
              <span style={{ fontSize: 13, color: '#94A3B8' }}>No hay atletas registrados</span>
            )}
          </div>
        </div>
      )}

      {!effectiveAthleteId && !isAthlete ? (
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16,
          padding: '64px 24px', textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={22} color="#CBD5E1" />
            </div>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Selecciona un atleta</h3>
          <p style={{ fontSize: 14, color: '#94A3B8' }}>Elige un atleta para ver y gestionar sus récords personales</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

          {/* LEFT — PRs list */}
          <div>
            <div style={{
              background: '#fff', border: '1px solid #E2E8F0',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Trophy size={16} color="#E53E3E" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                    Récords personales
                    {selectedAthlete && <span style={{ color: '#64748B', fontWeight: 400 }}> — {selectedAthlete.first_name} {selectedAthlete.last_name}</span>}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, background: '#F1F5F9', color: '#475569', borderRadius: 20, padding: '2px 8px' }}>
                  {prs.length}
                </span>
              </div>

              {prsLoading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Cargando...</div>
              ) : prs.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 16 }}>
                    Sin PRs registrados todavía
                  </p>
                  <button
                    onClick={() => openAdd()}
                    style={{ background: '#E53E3E', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Registrar primer PR
                  </button>
                </div>
              ) : (
                <div>
                  {prs.map((pr, i) => {
                    const rm = pr.estimated_1rm ?? pr.weight_kg
                    const isSelected = pr.movement_name === movementName
                    const isHistoryOpen = historyMovement === pr.movement_name

                    return (
                      <div key={pr.id}>
                        <div
                          style={{
                            padding: '14px 20px',
                            borderBottom: '1px solid #F8FAFC',
                            background: isSelected ? '#FFFBFB' : '#fff',
                            cursor: 'pointer',
                            transition: 'background 0.12s',
                            display: 'flex', alignItems: 'center', gap: 14,
                          }}
                          onClick={() => {
                            setSelectedMovement(pr.movement_name)
                            setCustomMovement('')
                            setManualOneRM(String(rm))
                            setCalcWeight('')
                            setCalcReps('1')
                          }}
                          onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
                          onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#fff' }}
                        >
                          {/* Rank number */}
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                            background: isSelected ? '#E53E3E' : '#F1F5F9',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700,
                            color: isSelected ? '#fff' : '#64748B',
                            transition: 'all 0.12s',
                          }}>
                            {i + 1}
                          </div>

                          {/* Movement info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{pr.movement_name}</div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                              {pr.reps > 1 ? `${pr.weight_kg} kg × ${pr.reps} reps` : `${pr.weight_kg} kg`}
                              {pr.reps > 1 && pr.estimated_1rm && (
                                <span style={{ color: '#94A3B8' }}> · 1RM estimado: {pr.estimated_1rm} kg</span>
                              )}
                            </div>
                          </div>

                          {/* 1RM badge */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
                              {rm} <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>kg</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>
                              {new Date(pr.recorded_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button
                              onClick={e => { e.stopPropagation(); setHistoryMovement(isHistoryOpen ? null : pr.movement_name) }}
                              title="Ver historial"
                              style={{ background: 'transparent', border: '1px solid #E2E8F0', borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center' }}
                            >
                              {isHistoryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); openAdd(pr.movement_name) }}
                              title="Agregar nuevo"
                              style={{ background: 'transparent', border: '1px solid #E2E8F0', borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center' }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        {/* History drawer */}
                        {isHistoryOpen && (
                          <div style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', padding: '12px 20px 12px 66px' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                              Historial — {pr.movement_name}
                            </p>
                            {history.length === 0 ? (
                              <p style={{ fontSize: 12, color: '#94A3B8' }}>Sin registros anteriores</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {history.map(h => (
                                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 12, color: '#64748B', minWidth: 90 }}>
                                      {new Date(h.recorded_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                                      {h.weight_kg} kg {h.reps > 1 && `× ${h.reps}`}
                                    </span>
                                    {h.estimated_1rm && h.reps > 1 && (
                                      <span style={{ fontSize: 11, color: '#94A3B8' }}>→ 1RM est. {h.estimated_1rm} kg</span>
                                    )}
                                    {h.notes && (
                                      <span style={{ fontSize: 11, color: '#94A3B8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        · {h.notes}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => { if (confirm('¿Eliminar este registro?')) deleteMutation.mutate(h.id) }}
                                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: '2px', display: 'flex', alignItems: 'center' }}
                                      onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                                      onMouseLeave={e => (e.currentTarget.style.color = '#CBD5E1')}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Calculator (sticky) */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{
              background: '#fff', border: '1px solid #E2E8F0',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calculator size={16} color="#E53E3E" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Calculadora de %</span>
              </div>

              <div style={{ padding: '16px 20px' }}>
                {/* Movement selector */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Movimiento
                  </label>
                  <select
                    value={customMovement ? '__custom' : selectedMovement}
                    onChange={e => {
                      if (e.target.value === '__custom') {
                        setCustomMovement(' ')
                      } else {
                        setSelectedMovement(e.target.value)
                        setCustomMovement('')
                        const saved = prs.find(p => p.movement_name === e.target.value)
                        if (saved) setManualOneRM(String(saved.estimated_1rm ?? saved.weight_kg))
                        else setManualOneRM('')
                      }
                    }}
                    style={{ ...inputStyle, appearance: 'none' as const }}
                  >
                    {COMMON_MOVEMENTS.map(m => <option key={m} value={m}>{m}</option>)}
                    <option value="__custom">Otro (escribir)</option>
                  </select>
                  {customMovement.trim() !== '' || customMovement === ' ' ? (
                    <input
                      autoFocus
                      value={customMovement === ' ' ? '' : customMovement}
                      onChange={e => setCustomMovement(e.target.value)}
                      placeholder="Nombre del movimiento"
                      style={{ ...inputStyle, marginTop: 6 }}
                    />
                  ) : null}
                </div>

                {/* 1RM manual */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    1RM (kg)
                  </label>
                  <input
                    type="number" step="0.5" min="0"
                    value={manualOneRM}
                    onChange={e => { setManualOneRM(e.target.value); setCalcWeight(''); setCalcReps('1') }}
                    placeholder="Ej. 100"
                    style={inputStyle}
                  />
                </div>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0' }}>
                  <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
                  <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>O estimar desde</span>
                  <div style={{ flex: 1, height: 1, background: '#F1F5F9' }} />
                </div>

                {/* Estimate from weight + reps */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Peso (kg)
                    </label>
                    <input
                      type="number" step="0.5" min="0"
                      value={calcWeight}
                      onChange={e => { setCalcWeight(e.target.value); setManualOneRM('') }}
                      placeholder="80"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Reps
                    </label>
                    <input
                      type="number" step="1" min="1" max="20"
                      value={calcReps}
                      onChange={e => { setCalcReps(e.target.value); setManualOneRM('') }}
                      placeholder="5"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {estimated && !manualOneRM && (
                  <div style={{
                    background: '#F0FDF4', border: '1px solid #BBF7D0',
                    borderRadius: 8, padding: '8px 12px', marginBottom: 14,
                    fontSize: 13, color: '#15803D',
                  }}>
                    1RM estimado (Epley): <strong>{estimated} kg</strong>
                  </div>
                )}
              </div>

              {/* Percentage table */}
              {table ? (
                <div style={{ borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ padding: '12px 20px 6px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Tabla de porcentajes — {oneRM} kg
                  </div>
                  <div style={{ padding: '0 12px 12px' }}>
                    {table.map(row => {
                      const zone = PCT_ZONE[row.pct]
                      return (
                        <div
                          key={row.pct}
                          style={{
                            display: 'flex', alignItems: 'center',
                            padding: '6px 10px', borderRadius: 8,
                            marginBottom: 3,
                            background: zone?.bg ?? '#F8FAFC',
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 700, color: zone?.text ?? '#475569', width: 40 }}>
                            {row.pct}%
                          </span>
                          <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                            {row.kg} kg
                          </span>
                          <span style={{ fontSize: 12, color: '#94A3B8', marginRight: 8 }}>
                            ~{row.kg_rounded} kg
                          </span>
                          {zone?.label && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: zone.text, background: 'rgba(255,255,255,0.6)', padding: '1px 6px', borderRadius: 10 }}>
                              {zone.label}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {effectiveAthleteId && (
                    <div style={{ padding: '0 12px 12px' }}>
                      <button
                        onClick={() => openAdd(movementName)}
                        style={{
                          width: '100%', padding: '9px', background: '#0F172A', color: '#fff',
                          border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#E53E3E')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#0F172A')}
                      >
                        <Plus size={14} />
                        Guardar {oneRM} kg como PR
                      </button>
                    </div>
                  )}

                  <div style={{ padding: '0 12px 12px', fontSize: 10.5, color: '#94A3B8', textAlign: 'center' }}>
                    Fórmula Epley · Redondeado a 2.5 kg
                  </div>
                </div>
              ) : (
                <div style={{ padding: '0 20px 20px', fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>
                  Ingresa un 1RM o peso + reps para ver la tabla
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add PR Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FFF5F5', border: '1px solid #FED7D7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy size={16} color="#E53E3E" />
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Registrar PR</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', padding: '6px', display: 'flex', color: '#64748B' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePR} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Movimiento *</label>
                <input
                  list="movements-list"
                  required autoFocus
                  value={addForm.movement_name}
                  onChange={e => setAddForm(f => ({ ...f, movement_name: e.target.value }))}
                  placeholder="Ej. Back Squat"
                  style={inputStyle}
                />
                <datalist id="movements-list">
                  {COMMON_MOVEMENTS.map(m => <option key={m} value={m} />)}
                </datalist>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Peso (kg) *</label>
                  <input
                    type="number" step="0.5" min="0" required
                    value={addForm.weight_kg}
                    onChange={e => setAddForm(f => ({ ...f, weight_kg: e.target.value }))}
                    placeholder="100"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Reps</label>
                  <input
                    type="number" step="1" min="1" max="20"
                    value={addForm.reps}
                    onChange={e => setAddForm(f => ({ ...f, reps: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Preview estimated 1RM */}
              {parseInt(addForm.reps) > 1 && parseFloat(addForm.weight_kg) > 0 && (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#15803D' }}>
                  1RM estimado: <strong>{epley1RM(parseFloat(addForm.weight_kg), parseInt(addForm.reps))} kg</strong>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Fecha</label>
                <input
                  type="date"
                  value={addForm.recorded_at}
                  onChange={e => setAddForm(f => ({ ...f, recorded_at: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Notas</label>
                <input
                  value={addForm.notes}
                  onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej. Con cinturón, sentía forma sólida..."
                  style={inputStyle}
                />
              </div>

              {saveMutation.error && (
                <div style={{ fontSize: 13, color: '#EF4444', background: '#FFF5F5', border: '1px solid #FEE2E2', padding: '8px 12px', borderRadius: 8 }}>
                  {(saveMutation.error as Error).message}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13.5, cursor: 'pointer', background: 'transparent', color: '#64748B' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saveMutation.isPending} style={{ flex: 1, padding: '10px', background: saveMutation.isPending ? '#F1F5F9' : '#E53E3E', color: saveMutation.isPending ? '#94A3B8' : '#fff', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: saveMutation.isPending ? 'not-allowed' : 'pointer' }}>
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar PR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
