'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSesionDeHoy, marcarRealizado, desmarcarRealizado,
  getRegistroDeSesion, guardarSensacion, type Sensacion,
} from '@/lib/queries/sessions'
import { mensajeDeError } from '@/lib/errors'
import { etiquetaDeDia } from '@/lib/fechas'
import { Check, Loader2, RotateCcw } from 'lucide-react'
import { useState } from 'react'

const LIMA = '#C6FF00'
const VERDE = '#22C55E'

/**
 * Escala de 1 a 5, la que ya acepta la columna feeling de session_logs.
 * Las caras evitan tener que leer: se responde de un vistazo, que es lo unico
 * que alguien hace justo despues de entrenar.
 */
const SENSACIONES: { valor: Sensacion; cara: string; texto: string }[] = [
  { valor: 1, cara: '😵', texto: 'Muy mal' },
  { valor: 2, cara: '😕', texto: 'Mal' },
  { valor: 3, cara: '😐', texto: 'Normal' },
  { valor: 4, cara: '🙂', texto: 'Bien' },
  { valor: 5, cara: '🔥', texto: 'Excelente' },
]

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
    qc.invalidateQueries({ queryKey: ['registro-sesion'] })
  }

  /** Lo que ya haya anotado de esta sesion, para no volver a preguntarlo. */
  const { data: registro } = useQuery({
    queryKey: ['registro-sesion', sesion?.id],
    queryFn: () => getRegistroDeSesion(sesion!.id),
    enabled: !!sesion?.id && sesion?.status === 'completed',
  })

  const anotarSensacion = useMutation({
    mutationFn: (valor: Sensacion) => guardarSensacion(sesion!.id, valor),
    onSuccess: () => {
      setError('')
      qc.invalidateQueries({ queryKey: ['registro-sesion', sesion?.id] })
    },
    onError: (e: unknown) => setError(mensajeDeError(e, 'No pudimos guardar cómo te sentiste.')),
  })

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
        <>
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

        {/* Cómo te sentiste. Va después de marcar, no antes: preguntarlo
            mientras aún no entrena no tiene respuesta posible. */}
        <div style={{
          marginTop: 12, padding: '14px 18px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)', borderRadius: 14,
        }}>
          <p style={{
            fontSize: 13, fontWeight: 700, color: 'var(--color-text-2)',
            marginBottom: 10,
          }}>
            {registro?.feeling ? '¿Cómo te sentiste?' : '¿Cómo te sentiste? (opcional)'}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SENSACIONES.map(s => {
              const elegida = registro?.feeling === s.valor
              return (
                <button
                  key={s.valor}
                  onClick={() => anotarSensacion.mutate(s.valor)}
                  disabled={anotarSensacion.isPending}
                  aria-label={s.texto}
                  aria-pressed={elegida}
                  className="eb-tap"
                  style={{
                    flex: '1 1 60px', minWidth: 58,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    padding: '9px 6px', borderRadius: 11, cursor: 'pointer',
                    background: elegida ? `${VERDE}1E` : 'transparent',
                    border: `1px solid ${elegida ? VERDE : 'var(--color-border)'}`,
                    transition: 'background .12s, border-color .12s',
                  }}
                >
                  <span style={{ fontSize: 21, lineHeight: 1 }}>{s.cara}</span>
                  <span style={{
                    fontSize: 10.5, fontWeight: 700,
                    color: elegida ? VERDE : 'var(--color-text-3)',
                  }}>
                    {s.texto}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        </>
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
