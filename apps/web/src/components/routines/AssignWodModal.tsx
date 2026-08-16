'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { bulkAssign, getRoutineSchedule } from '@/lib/queries/sessions'
import { createClient } from '@/lib/supabase/client'
import { AthleteGroupSelector } from './AthleteGroupSelector'
import { MultiDatePicker, formatoCorto } from './DatePicker'
import { mensajeDeError } from '@/lib/errors'
import { X, Check, CalendarDays } from 'lucide-react'

/** Sesiones ya agendadas de un WOD, para no duplicarlas. */
async function getWodSchedule(wodId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_sessions')
    .select('id, athlete_id, scheduled_date')
    .eq('wod_id', wodId)
    .order('scheduled_date')
  if (error) throw error
  return (data ?? []) as { id: string; athlete_id: string; scheduled_date: string }[]
}

/** Bajo 860px los dos paneles no caben lado a lado. */
function useEsAngosto() {
  const [angosto, setAngosto] = useState(false)
  useEffect(() => {
    const check = () => setAngosto(window.innerWidth < 860)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return angosto
}

/**
 * A diferencia de una rutina, un WOD no tiene "acceso": se asigna agendandolo.
 * Por eso aqui la fecha es obligatoria, mientras que en la rutina es opcional.
 */
export function AssignWodModal({ wodId, wodName, onClose, onSaved }: {
  wodId: string
  wodName: string
  onClose: () => void
  onSaved: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [fechas, setFechas] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const angosto = useEsAngosto()

  const { data: agenda = [] } = useQuery({
    queryKey: ['wod-schedule', wodId],
    queryFn: () => getWodSchedule(wodId),
  })

  const diasYaAgendados = useMemo(
    () => [...new Set(agenda.map(s => s.scheduled_date))].sort(),
    [agenda]
  )

  async function guardar() {
    if (selected.size === 0) return setError('Selecciona al menos un atleta')
    if (fechas.length === 0) return setError('Elige al menos un día')

    setSaving(true)
    setError(null)
    try {
      const yaExiste = new Set(agenda.map(s => `${s.athlete_id}|${s.scheduled_date}`))
      const pendientes = [...selected].filter(aid =>
        fechas.some(f => !yaExiste.has(`${aid}|${f}`))
      )
      if (pendientes.length > 0) {
        await bulkAssign({
          athlete_ids: pendientes,
          type: 'wod',
          wod_id: wodId,
          dates: fechas,
        })
      }
      onSaved()
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo agendar el WOD'))
    } finally {
      setSaving(false)
    }
  }

  const resumen = [
    `${selected.size} atleta${selected.size !== 1 ? 's' : ''}`,
    fechas.length > 0 ? `${fechas.length} día${fechas.length !== 1 ? 's' : ''}` : 'sin fecha',
  ].join(' · ')

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: 18, width: '100%',
        maxWidth: angosto ? 480 : 820, maxHeight: '86vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)', border: '1px solid var(--color-border)',
      }}>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 22px', borderBottom: '1px solid var(--color-border)', flexShrink: 0,
        }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
              Agendar {wodName}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-2)', marginTop: 2 }}>{resumen}</p>
          </div>
          <button
            className="eb-tap"
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              borderRadius: 8, cursor: 'pointer', padding: 6, display: 'flex',
              alignItems: 'center', color: 'var(--color-text-2)', flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* A quién · cuándo */}
        <div style={{
          flex: 1, minHeight: 0, display: 'flex',
          flexDirection: angosto ? 'column' : 'row',
          overflowY: angosto ? 'auto' : 'hidden',
        }}>
          <div style={{
            flex: 1, minWidth: 0,
            overflowY: angosto ? 'visible' : 'auto',
            borderRight: angosto ? 'none' : '1px solid var(--color-border)',
          }}>
            <AthleteGroupSelector selected={selected} onChange={setSelected} />
          </div>

          <div style={{
            width: angosto ? '100%' : 320, flexShrink: 0,
            overflowY: angosto ? 'visible' : 'auto',
            borderTop: angosto ? '1px solid var(--color-border)' : 'none',
            background: angosto ? 'transparent' : 'var(--color-surface-2)',
          }}>
            <div style={{ padding: '14px 20px 8px', display: 'flex', alignItems: 'center', gap: 7 }}>
              <CalendarDays size={14} color="#6366F1" />
              <span style={{
                fontSize: 10.5, fontWeight: 700, color: 'var(--color-text-3)',
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
                Días
              </span>
            </div>

            <div style={{ padding: '0 20px 20px' }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-3)', lineHeight: 1.55, marginBottom: 12 }}>
                El WOD aparecerá en el calendario de cada atleta el día que elijas.
              </p>

              {diasYaAgendados.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                  padding: '8px 11px', marginBottom: 12, borderRadius: 9,
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                }}>
                  <Check size={11} color="#22C55E" />
                  <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontWeight: 600 }}>
                    Ya agendado:
                  </span>
                  {diasYaAgendados.map(d => (
                    <span key={d} style={{ fontSize: 11, color: '#22C55E', fontWeight: 700 }}>
                      {formatoCorto(d)}
                    </span>
                  ))}
                </div>
              )}

              <MultiDatePicker value={fechas} onChange={setFechas} />
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 22px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
          {error && <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 10 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '10px', border: '1px solid var(--color-border)',
                borderRadius: 10, fontSize: 13.5, cursor: 'pointer',
                background: 'transparent', color: 'var(--color-text-2)', fontWeight: 500,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={saving}
              style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: 10,
                fontSize: 13.5, fontWeight: 700,
                background: saving ? 'var(--color-surface-2)' : '#6366F1',
                color: saving ? 'var(--color-text-3)' : '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving
                ? 'Agendando...'
                : selected.size > 0 && fechas.length > 0
                ? `Agendar a ${selected.size} en ${fechas.length} día${fechas.length !== 1 ? 's' : ''}`
                : 'Agendar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
