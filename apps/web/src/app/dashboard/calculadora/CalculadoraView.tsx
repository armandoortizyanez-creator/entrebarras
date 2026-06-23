'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAthletes, getMyAthlete } from '@/lib/queries/athletes'
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
  100: { bg: 'rgba(99,102,241,0.08)', text: '#6366F1', label: '1RM' },
  105: { bg: '#F5F3FF', text: '#6D28D9', label: 'Objetivo' },
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px',
  border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13.5,
  color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none',
}

export function CalculadoraView() {
  const { role, isAthlete, loading } = useUser()
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

  // Load athletes (coaches/admins only) "” wait for auth to resolve first
  const { data: athletes = [] } = useQuery({
    queryKey: ['athletes'],
    queryFn: () => getAthletes(),
    enabled: !loading && !isAthlete,
  })

  // Load own athlete profile when role = athlete
  const { data: myAthlete } = useQuery({
    queryKey: ['my-athlete'],
    queryFn: () => getMyAthlete(),
    enabled: !loading && isAthlete,
  })

  // PRs for selected athlete
  const effectiveAthleteId = isAthlete ? (myAthlete?.id ?? null) : selectedAthleteId
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

  function openAdd(movement?: string, weight?: number) {
    setAddForm(f => ({
      ...f,
      movement_name: movement || movementName,
      weight_kg: weight ? String(weight) : f.weight_kg,
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
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.04em' }}>
            Calculadora de % y PRs
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-2)', marginTop: 4 }}>
            Máximos por movimiento y tabla de porcentajes para programar cargas
          </p>
        </div>

        {effectiveAthleteId && (
          <button
            onClick={() => openAdd()}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#6366F1', color: '#fff', border: 'none',
              borderRadius: 10, padding: '9px 18px',
              fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Plus size={15} />
            Registrar PR
          </button>
        )}
      </div>

      {/* Athlete selector (coaches only) "” athletes see their own name */}
      {isAthlete && myAthlete && (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 14, padding: '14px 20px', marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', border: '1px solid #FED7D7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trophy size={16} color="#C6FF00" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
              {myAthlete.first_name} {myAthlete.last_name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>Tus récords personales</div>
          </div>
        </div>
      )}

      {!isAthlete && (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 14, padding: '16px 20px', marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
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
                  borderColor: selectedAthleteId === a.id ? '#6366F1' : 'var(--color-border)',
                  background: selectedAthleteId === a.id ? 'rgba(99,102,241,0.08)' : 'var(--color-bg)',
                  color: selectedAthleteId === a.id ? '#6366F1' : 'var(--color-text-2)',
                  transition: 'all 0.12s',
                }}
              >
                {a.first_name} {a.last_name}
              </button>
            ))}
            {athletes.length === 0 && (
              <span style={{ fontSize: 13, color: 'var(--color-text-3)' }}>No hay atletas registrados</span>
            )}
          </div>
        </div>
      )}

      {!effectiveAthleteId && isAthlete ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-3)', fontSize: 14 }}>
          Cargando...
        </div>
      ) : !effectiveAthleteId && !isAthlete ? (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16,
          padding: '64px 24px', textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={22} color="var(--color-text-4)" />
            </div>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>Selecciona un atleta</h3>
          <p style={{ fontSize: 14, color: 'var(--color-text-3)' }}>Elige un atleta para ver y gestionar sus récords personales</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

          {/* LEFT "” PRs list */}
          <div>
            <div style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Trophy size={16} color="#C6FF00" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                    Récords personales
                    {selectedAthlete && <span style={{ color: 'var(--color-text-2)', fontWeight: 400 }}> "” {selectedAthlete.first_name} {selectedAthlete.last_name}</span>}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, background: 'var(--color-surface-2)', color: 'var(--color-text-2)', borderRadius: 20, padding: '2px 8px' }}>
                  {prs.length}
                </span>
              </div>

              {prsLoading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-3)', fontSize: 13 }}>Cargando...</div>
              ) : prs.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: 'var(--color-text-3)', marginBottom: 16 }}>
                    Sin PRs registrados todavía
                  </p>
                  <button
                    onClick={() => openAdd()}
                    style={{ background: '#6366F1', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
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
                            borderBottom: '1px solid var(--color-border)',
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
                          onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--color-bg)' }}
                          onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#fff' }}
                        >
                          {/* Rank number */}
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                            background: isSelected ? '#6366F1' : 'var(--color-surface-2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700,
                            color: isSelected ? '#fff' : 'var(--color-text-2)',
                            transition: 'all 0.12s',
                          }}>
                            {i + 1}
                          </div>

                          {/* Movement info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{pr.movement_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 2 }}>
                              {pr.reps > 1 ? `${pr.weight_kg} kg Í— ${pr.reps} reps` : `${pr.weight_kg} kg`}
                              {pr.reps > 1 && pr.estimated_1rm && (
                                <span style={{ color: 'var(--color-text-3)' }}> Â· 1RM estimado: {pr.estimated_1rm} kg</span>
                              )}
                            </div>
                          </div>

                          {/* 1RM badge */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                              {rm} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-3)' }}>kg</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>
                              {new Date(pr.recorded_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button
                              onClick={e => { e.stopPropagation(); setHistoryMovement(isHistoryOpen ? null : pr.movement_name) }}
                              title="Ver historial"
                              style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: 'var(--color-text-3)', display: 'flex', alignItems: 'center' }}
                            >
                              {isHistoryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); openAdd(pr.movement_name) }}
                              title="Agregar nuevo"
                              style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: 'var(--color-text-3)', display: 'flex', alignItems: 'center' }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        {/* History drawer */}
                        {isHistoryOpen && (
                          <div style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', padding: '12px 20px 12px 66px' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                              Historial "” {pr.movement_name}
                            </p>
                            {history.length === 0 ? (
                              <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>Sin registros anteriores</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {history.map(h => (
                                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 12, color: 'var(--color-text-2)', minWidth: 90 }}>
                                      {new Date(h.recorded_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                                      {h.weight_kg} kg {h.reps > 1 && `Í— ${h.reps}`}
                                    </span>
                                    {h.estimated_1rm && h.reps > 1 && (
                                      <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>â†’ 1RM est. {h.estimated_1rm} kg</span>
                                    )}
                                    {h.notes && (
                                      <span style={{ fontSize: 11, color: 'var(--color-text-3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        Â· {h.notes}
                                      </span>
                                    )}
                                    <button
                                      onClick={() => { if (confirm('¿Eliminar este registro?')) deleteMutation.mutate(h.id) }}
                                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-4)', padding: '2px', display: 'flex', alignItems: 'center' }}
                                      onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-4)')}
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

          {/* RIGHT "” Calculator (sticky) */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calculator size={16} color="#C6FF00" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Calculadora de %</span>
              </div>

              <div style={{ padding: '16px 20px' }}>
                {/* Movement selector */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
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
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
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
                  <div style={{ flex: 1, height: 1, background: 'var(--color-surface-2)' }} />
                  <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontWeight: 600 }}>O estimar desde</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-surface-2)' }} />
                </div>

                {/* Estimate from weight + reps */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
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
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
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
                <div style={{ borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ padding: '12px 20px 6px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Tabla de porcentajes "” {oneRM} kg
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
                            background: zone?.bg ?? 'var(--color-bg)',
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 700, color: zone?.text ?? 'var(--color-text-2)', width: 40 }}>
                            {row.pct}%
                          </span>
                          <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                            {row.kg} kg
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--color-text-3)', marginRight: 8 }}>
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
                        onClick={() => openAdd(movementName, oneRM ?? undefined)}
                        style={{
                          width: '100%', padding: '9px', background: 'var(--color-text)', color: 'var(--color-surface)',
                          border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#6366F1')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-text)')}
                      >
                        <Plus size={14} />
                        Guardar {oneRM} kg como PR
                      </button>
                    </div>
                  )}

                  <div style={{ padding: '0 12px 12px', fontSize: 10.5, color: 'var(--color-text-3)', textAlign: 'center' }}>
                    Fórmula Epley Â· Redondeado a 2.5 kg
                  </div>
                </div>
              ) : (
                <div style={{ padding: '0 20px 20px', fontSize: 13, color: 'var(--color-text-3)', textAlign: 'center' }}>
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
          <div style={{ background: 'var(--color-surface)', borderRadius: 18, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.2)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', border: '1px solid #FED7D7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy size={16} color="#C6FF00" />
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Registrar PR</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', padding: '6px', display: 'flex', color: 'var(--color-text-2)' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePR} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Movimiento *</label>
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
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Peso (kg) *</label>
                  <input
                    type="number" step="0.5" min="0" required
                    value={addForm.weight_kg}
                    onChange={e => setAddForm(f => ({ ...f, weight_kg: e.target.value }))}
                    placeholder="100"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Reps</label>
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
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Fecha</label>
                <input
                  type="date"
                  value={addForm.recorded_at}
                  onChange={e => setAddForm(f => ({ ...f, recorded_at: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Notas</label>
                <input
                  value={addForm.notes}
                  onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej. Con cinturón, sentía forma sólida..."
                  style={inputStyle}
                />
              </div>

              {saveMutation.error && (
                <div style={{ fontSize: 13, color: '#EF4444', background: 'rgba(99,102,241,0.08)', border: '1px solid #FEE2E2', padding: '8px 12px', borderRadius: 8 }}>
                  {(saveMutation.error as Error).message}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 13.5, cursor: 'pointer', background: 'transparent', color: 'var(--color-text-2)' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saveMutation.isPending} style={{ flex: 1, padding: '10px', background: saveMutation.isPending ? 'var(--color-surface-2)' : '#6366F1', color: saveMutation.isPending ? 'var(--color-text-3)' : '#fff', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: saveMutation.isPending ? 'not-allowed' : 'pointer' }}>
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
