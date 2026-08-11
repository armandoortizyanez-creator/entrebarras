'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/** YYYY-MM-DD en hora local. `toISOString()` desplaza el dia segun la zona. */
export function aFechaLocal(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export function formatoCorto(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MESES[m - 1].slice(0, 3)}`
}

/** Lunes = 0 … Domingo = 6 (getDay() usa domingo = 0). */
function indiceDia(fecha: Date): number {
  return (fecha.getDay() + 6) % 7
}

export function MultiDatePicker({ value, onChange }: {
  value: string[]
  onChange: (fechas: string[]) => void
}) {
  const hoy = new Date()
  const [cursor, setCursor] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1))

  const primerDia = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const diasEnMes = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
  const offset = indiceDia(primerDia)
  const hoyIso = aFechaLocal(hoy)

  const celdas: (string | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) =>
      aFechaLocal(new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))
    ),
  ]

  function alternar(iso: string) {
    onChange(
      value.includes(iso)
        ? value.filter(f => f !== iso)
        : [...value, iso].sort()
    )
  }

  function mover(delta: number) {
    setCursor(c => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  return (
    <div>
      {/* Cabecera del mes */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button
          type="button"
          onClick={() => mover(-1)}
          aria-label="Mes anterior"
          style={navBtn}
        >
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', textTransform: 'capitalize' }}>
          {MESES[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => mover(1)}
          aria-label="Mes siguiente"
          style={navBtn}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Encabezado de días */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 4 }}>
        {DIAS.map((d, i) => (
          <span key={i} style={{
            fontSize: 10, fontWeight: 700, textAlign: 'center',
            color: 'var(--color-text-4)', textTransform: 'uppercase',
          }}>
            {d}
          </span>
        ))}
      </div>

      {/* Grilla */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {celdas.map((iso, i) => {
          if (!iso) return <span key={`v${i}`} />
          const elegido = value.includes(iso)
          const esHoy = iso === hoyIso
          const pasado = iso < hoyIso
          return (
            <button
              key={iso}
              type="button"
              onClick={() => alternar(iso)}
              title={pasado ? 'Fecha pasada' : undefined}
              style={{
                aspectRatio: '1', border: 'none', cursor: 'pointer',
                borderRadius: 7, fontSize: 12,
                fontWeight: elegido || esHoy ? 800 : 500,
                background: elegido ? '#6366F1' : 'transparent',
                color: elegido
                  ? '#fff'
                  : pasado
                  ? 'var(--color-text-4)'
                  : esHoy
                  ? '#6366F1'
                  : 'var(--color-text-2)',
                outline: esHoy && !elegido ? '1px solid #6366F1' : 'none',
                outlineOffset: -1,
                transition: 'background 0.1s',
              }}
            >
              {Number(iso.slice(-2))}
            </button>
          )
        })}
      </div>

      {/* Seleccionadas */}
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 12 }}>
          {value.map(iso => (
            <span
              key={iso}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 11.5, fontWeight: 700, padding: '3px 6px 3px 10px',
                borderRadius: 20, background: 'rgba(99,102,241,0.10)',
                color: '#6366F1', border: '1px solid rgba(99,102,241,0.22)',
              }}
            >
              {formatoCorto(iso)}
              <button
                type="button"
                onClick={() => alternar(iso)}
                aria-label={`Quitar ${formatoCorto(iso)}`}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: '#6366F1', display: 'flex', alignItems: 'center', padding: 1, opacity: 0.7,
                }}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  background: 'transparent', border: '1px solid var(--color-border)',
  borderRadius: 7, cursor: 'pointer', padding: '4px 7px',
  display: 'flex', alignItems: 'center', color: 'var(--color-text-2)',
}
