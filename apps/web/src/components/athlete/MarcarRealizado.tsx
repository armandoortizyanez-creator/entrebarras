'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSesionDeHoy, marcarRealizado, desmarcarRealizado } from '@/lib/queries/sessions'
import { mensajeDeError } from '@/lib/errors'
import { etiquetaDeDia } from '@/lib/fechas'
import { Check, Loader2, RotateCcw } from 'lucide-react'
import { useState } from 'react'

const LIMA = '#C6FF00'
const VERDE = '#22C55E'

/**
 * Botón con el que el atleta deja constancia de que entrenó.
 *
 * Al marcar, el registro queda con la fecha de hoy, y con eso aparece en su
 * calendario, en su programación y en el cumplimiento que ve el coach. Todo
 * eso ya se alimentaba de training_sessions; lo que faltaba era que el atleta
 * pudiera escribir ahí.
 *
 * Se puede deshacer: marcar la rutina equivocada es fácil y no deberia obligar
 * a escribirle al coach para corregirlo.
 */
export function MarcarRealizado({ routineId, wodId }: { routineId?: string; wodId?: string }) {
  const qc = useQueryClient()
  const [error, setError] = useState('')

  const clave = ['sesion-de-hoy', routineId ?? wodId] as const

  const { data: sesion, isLoading } = useQuery({
    queryKey: clave,
    queryFn: () => getSesionDeHoy({ routineId, wodId }),
  })

  /** Refresca todo lo que muestra el estado del día, no solo este botón. */
  const refrescar = () => {
    qc.invalidateQueries({ queryKey: clave })
    qc.invalidateQueries({ queryKey: ['mi-agenda'] })
    qc.invalidateQueries({ queryKey: ['my-sessions'] })
    qc.invalidateQueries({ queryKey: ['sessions'] })
  }

  const marcar = useMutation({
    mutationFn: () => marcarRealizado({ routineId, wodId }),
    onSuccess: () => { setError(''); refrescar() },
    onError: (e: unknown) => setError(mensajeDeError(e, 'No pudimos guardarlo. Intenta de nuevo.')),
  })

  const desmarcar = useMutation({
    mutationFn: () => desmarcarRealizado(sesion!.id),
    onSuccess: () => { setError(''); refrescar() },
    onError: (e: unknown) => setError(mensajeDeError(e, 'No pudimos deshacerlo. Intenta de nuevo.')),
  })

  const hecho = sesion?.status === 'completed'
  const trabajando = marcar.isPending || desmarcar.isPending

  if (isLoading) {
    return <div style={{ height: 52, borderRadius: 14, background: 'var(--color-surface-2)' }} />
  }

  return (
    <div>
      {hecho ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          background: 'rgba(34,197,94,0.10)', border: `1px solid rgba(34,197,94,0.35)`,
          borderRadius: 14, padding: '14px 18px',
        }}>
          <span style={{
            width: 30, height: 30, borderRadius: '50%', background: VERDE, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Check size={17} color="#fff" strokeWidth={3} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14.5, fontWeight: 800, color: VERDE, letterSpacing: '-0.01em' }}>
              Realizado
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', textTransform: 'capitalize' }}>
              {etiquetaDeDia(sesion!.scheduled_date)}
            </p>
          </div>
          <button
            onClick={() => desmarcar.mutate()}
            disabled={trabajando}
            className="eb-tap"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: '1px solid var(--color-border)',
              borderRadius: 9, padding: '7px 13px', cursor: trabajando ? 'default' : 'pointer',
              fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-3)',
            }}
          >
            {desmarcar.isPending
              ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              : <RotateCcw size={13} />}
            Deshacer
          </button>
        </div>
      ) : (
        <button
          onClick={() => marcar.mutate()}
          disabled={trabajando}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            background: LIMA, color: '#0D1117', border: 'none',
            borderRadius: 14, padding: '15px 24px',
            fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em',
            cursor: trabajando ? 'default' : 'pointer',
            opacity: trabajando ? 0.75 : 1,
          }}
        >
          {marcar.isPending
            ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
            : <Check size={17} strokeWidth={3} />}
          {marcar.isPending ? 'Guardando...' : 'Marcar como realizado'}
        </button>
      )}

      {error && (
        <p role="alert" style={{ marginTop: 10, fontSize: 13, color: 'var(--color-error, #EF4444)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
