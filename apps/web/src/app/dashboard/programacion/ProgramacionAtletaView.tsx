'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { getMiAgenda, type EntradaAgenda } from '@/lib/queries/sessions'
import { aFechaLocal, hoyLocal, etiquetaRelativa } from '@/lib/fechas'
import { ChevronLeft, ChevronRight, Dumbbell, Zap, CalendarDays, Check } from 'lucide-react'

const ACCENT = '#6366F1'
const LIMA = '#C6FF00'

const TIPO_WOD: Record<string, string> = {
  amrap: 'AMRAP', emom: 'EMOM', for_time: 'For Time',
  tabata: 'Tabata', chipper: 'Chipper', intervals: 'Intervalos', custom: 'Personalizado',
}

/** Lunes de la semana que contiene la fecha dada. */
function inicioDeSemana(d: Date): Date {
  const r = new Date(d)
  const dia = r.getDay()
  r.setDate(r.getDate() + (dia === 0 ? -6 : 1 - dia))
  r.setHours(0, 0, 0, 0)
  return r
}

function sumarDias(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/**
 * La agenda del atleta: qué le toca cada día.
 *
 * Un día puede tener cuantas rutinas y WODs quiera el coach; acá se listan
 * todos, sin recortar. Cada tarjeta lleva al detalle correspondiente.
 */
export function ProgramacionAtletaView() {
  const [semana, setSemana] = useState(() => inicioDeSemana(new Date()))

  const desde = aFechaLocal(semana)
  const hasta = aFechaLocal(sumarDias(semana, 6))
  const hoy = hoyLocal()

  const { data: agenda = [], isLoading } = useQuery({
    queryKey: ['mi-agenda', desde, hasta],
    queryFn: () => getMiAgenda(desde, hasta),
  })

  const dias = Array.from({ length: 7 }, (_, i) => aFechaLocal(sumarDias(semana, i)))
  const porDia = new Map<string, EntradaAgenda[]>()
  for (const d of dias) porDia.set(d, [])
  for (const e of agenda) porDia.get(e.scheduled_date)?.push(e)

  const total = agenda.length

  return (
    <div className="eb-page" style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--color-text)', lineHeight: 1.1, marginBottom: 6 }}>
            Programación
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-3)' }}>
            {isLoading ? '...' : total === 0
              ? 'Sin entrenamientos esta semana'
              : `${total} entrenamiento${total !== 1 ? 's' : ''} esta semana`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BotonSemana etiqueta="Semana anterior" onClick={() => setSemana(s => sumarDias(s, -7))}>
            <ChevronLeft size={16} />
          </BotonSemana>
          <button
            onClick={() => setSemana(inicioDeSemana(new Date()))}
            style={{
              padding: '7px 14px', borderRadius: 9, cursor: 'pointer',
              border: '1px solid var(--color-border)', background: 'transparent',
              color: 'var(--color-text-2)', fontSize: 13, fontWeight: 600,
            }}
          >
            Hoy
          </button>
          <BotonSemana etiqueta="Semana siguiente" onClick={() => setSemana(s => sumarDias(s, 7))}>
            <ChevronRight size={16} />
          </BotonSemana>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {dias.map(dia => {
          const entradas = porDia.get(dia) ?? []
          const esHoy = dia === hoy

          return (
            <div key={dia}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em',
                  color: esHoy ? ACCENT : 'var(--color-text-2)',
                  textTransform: 'capitalize',
                }}>
                  {etiquetaRelativa(dia)}
                </span>
                {entradas.length > 1 && (
                  <span style={{ fontSize: 11.5, color: 'var(--color-text-4)', fontWeight: 600 }}>
                    {entradas.length} entrenamientos
                  </span>
                )}
              </div>

              {entradas.length === 0 ? (
                <div style={{
                  border: '1px dashed var(--color-border)', borderRadius: 12,
                  padding: '14px 18px', fontSize: 13, color: 'var(--color-text-4)',
                }}>
                  Día libre
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {entradas.map(e => <TarjetaEntrada key={e.id} entrada={e} />)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BotonSemana({ children, etiqueta, onClick }: { children: React.ReactNode; etiqueta: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={etiqueta}
      className="eb-tap"
      style={{
        padding: '7px 9px', borderRadius: 9, cursor: 'pointer',
        border: '1px solid var(--color-border)', background: 'transparent',
        color: 'var(--color-text-2)', display: 'flex', alignItems: 'center',
      }}
    >
      {children}
    </button>
  )
}

/** Rutina y WOD se distinguen por color, ícono y etiqueta. */
function TarjetaEntrada({ entrada }: { entrada: EntradaAgenda }) {
  const esWod = !!entrada.wod
  const completado = entrada.status === 'completed'

  const acento = esWod ? LIMA : ACCENT
  const nombre = entrada.wod?.name ?? entrada.routine?.name ?? 'Entrenamiento'
  const href = esWod && entrada.wod_id
    ? `/dashboard/wods/${entrada.wod_id}`
    : entrada.routine_id
      ? `/dashboard/mis-rutinas/${entrada.routine_id}`
      : '#'

  return (
    <Link
      href={href}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: `4px solid ${acento}`,
        borderRadius: 14, padding: '14px 18px',
        opacity: completado ? 0.65 : 1,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: `${acento}1E`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {esWod
          ? <Zap size={19} color={acento} />
          : <Dumbbell size={19} color={acento} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: acento, background: `${acento}18`, border: `1px solid ${acento}38`,
            borderRadius: 999, padding: '2px 7px',
          }}>
            {esWod ? 'WOD' : 'Rutina'}
          </span>
          {esWod && entrada.wod?.type && (
            <span style={{ fontSize: 11.5, color: 'var(--color-text-4)', fontWeight: 600 }}>
              {TIPO_WOD[entrada.wod.type] ?? entrada.wod.type}
            </span>
          )}
          {entrada.scheduled_time && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, color: 'var(--color-text-4)' }}>
              <CalendarDays size={11} />
              {entrada.scheduled_time.slice(0, 5)}
            </span>
          )}
        </div>
        <p style={{
          fontSize: 15, fontWeight: 700, color: 'var(--color-text)',
          letterSpacing: '-0.02em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textDecoration: completado ? 'line-through' : 'none',
        }}>
          {nombre}
        </p>
      </div>

      {completado && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
          fontSize: 11.5, fontWeight: 700, color: '#22C55E',
        }}>
          <Check size={13} />
          Hecho
        </span>
      )}
    </Link>
  )
}
