'use client'

import { useState } from 'react'
import { Weight, Check, AlertTriangle } from 'lucide-react'
import { BARRAS, calcularCarga, calcularFaltante, kgALb } from '@/lib/discos'
import type { Carga } from '@/lib/discos'

const ACCENT = '#6366F1'

const COLOR_UNIDAD: Record<string, string> = {
  kg: '#6366F1',
  lb: '#F59E0B',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px',
  border: '1px solid var(--color-border)', borderRadius: 10,
  fontSize: 15, fontWeight: 700,
  color: 'var(--color-text)', background: 'var(--color-surface)',
  boxSizing: 'border-box', outline: 'none',
}

const etiquetaStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: 'var(--color-text-3)', textTransform: 'uppercase',
  letterSpacing: '0.06em', marginBottom: 6,
}

/** La lista de discos de un lado. Se reusa para "cargar" y para "agregar". */
export function ListaDeDiscos({ carga, compacta = false }: { carga: Carga; compacta?: boolean }) {
  if (carga.porLado.length === 0) {
    return (
      <p style={{ fontSize: compacta ? 12.5 : 14, color: 'var(--color-text-3)' }}>
        Solo la barra, sin discos.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: compacta ? 5 : 7 }}>
      {carga.porLado.map(({ disco, cantidad }) => (
        <span
          key={disco.unidad + disco.valor}
          // El texto del chip queda partido en varios spans ("2×", "25", "kg"),
          // así que las pruebas se agarran de acá y no de cómo se ve.
          data-disco={`${cantidad}x${disco.valor}${disco.unidad}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: compacta ? '3px 8px' : '6px 12px',
            borderRadius: 999,
            background: COLOR_UNIDAD[disco.unidad] + '1E',
            border: '1px solid ' + COLOR_UNIDAD[disco.unidad] + '40',
            fontSize: compacta ? 12 : 14, fontWeight: 700,
            color: 'var(--color-text)',
          }}
        >
          {cantidad > 1 && (
            <span style={{ color: 'var(--color-text-3)', fontWeight: 600 }}>{cantidad}×</span>
          )}
          {disco.valor}
          <span style={{ fontSize: compacta ? 10 : 11.5, fontWeight: 700, color: COLOR_UNIDAD[disco.unidad] }}>
            {disco.unidad}
          </span>
        </span>
      ))}
    </div>
  )
}

/** "= 90 kg ✓" o "= 89.9 kg, 0.1 menos" */
function Resultado({ carga, compacta = false }: { carga: Carga; compacta?: boolean }) {
  const exacta = carga.exacta
  const color = exacta ? '#22C55E' : '#F59E0B'
  const dif = Math.abs(carga.diferenciaKg)

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: compacta ? 12 : 13.5, fontWeight: 700, color,
    }}>
      {exacta ? <Check size={compacta ? 12 : 14} /> : <AlertTriangle size={compacta ? 12 : 14} />}
      {carga.totalKg} kg
      {!exacta && (
        <span style={{ fontWeight: 600 }}>
          ({carga.diferenciaKg > 0 ? dif + ' de más' : dif + ' de menos'})
        </span>
      )}
      {carga.mezclada && (
        <span style={{ fontSize: compacta ? 9.5 : 10.5, fontWeight: 600, color: 'var(--color-text-3)' }}>
          mezcla kg + lb
        </span>
      )}
    </span>
  )
}

/**
 * Qué discos poner en la barra.
 *
 * Nace de un problema concreto del box: los discos están en kilos y en libras
 * y hay que combinarlos. El atleta terminaba haciendo la cuenta de cabeza a
 * mitad del entrenamiento —"cargué 20 por lado, ¿cuánto me falta?"— que es
 * justo cuando peor se calcula.
 *
 * Dos preguntas, en el orden en que aparecen de verdad:
 *   1. Quiero llegar a X: ¿qué pongo?
 *   2. Ya tengo Y puesto: ¿cuánto me falta y qué agrego?
 */
export function CalculadoraDeDiscos({ objetivoInicial }: { objetivoInicial?: number }) {
  // null = el atleta todavía no lo tocó, así que sigue al 1RM de la pantalla.
  // Con useState(objetivoInicial) no alcanzaba: el 1RM llega de una consulta,
  // varios cientos de milisegundos después de que el componente ya se montó,
  // y el campo se quedaba vacío para siempre.
  const [escrito, setEscrito] = useState<string | null>(null)
  const [barraKg, setBarraKg] = useState(20)
  const [cargado, setCargado] = useState('')

  const objetivo = escrito ?? (objetivoInicial ? String(objetivoInicial) : '')
  const setObjetivo = (v: string) => setEscrito(v)

  const objetivoKg = parseFloat(objetivo)
  const carga = Number.isFinite(objetivoKg) ? calcularCarga(objetivoKg, barraKg) : null

  const cargadoKg = parseFloat(cargado)
  const faltante = Number.isFinite(objetivoKg) && Number.isFinite(cargadoKg)
    ? calcularFaltante(objetivoKg, barraKg, cargadoKg)
    : null

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '16px 18px', borderBottom: '1px solid var(--color-border)',
      }}>
        <span style={{
          width: 36, height: 36, borderRadius: 11, flexShrink: 0,
          background: ACCENT + '1E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Weight size={18} color={ACCENT} />
        </span>
        <span>
          <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: 'var(--color-text)' }}>
            Discos por lado
          </span>
          <span style={{ display: 'block', fontSize: 12.5, color: 'var(--color-text-3)' }}>
            Combina kilos y libras
          </span>
        </span>
      </div>

      <div style={{ padding: '16px 18px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
          <div>
            <label htmlFor="discos-objetivo" style={etiquetaStyle}>Peso objetivo (kg)</label>
            <input
              id="discos-objetivo"
              type="number" inputMode="decimal" step="0.5" min="0"
              value={objetivo}
              onChange={e => setObjetivo(e.target.value)}
              placeholder="80"
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="discos-barra" style={etiquetaStyle}>Barra</label>
            <select
              id="discos-barra"
              value={barraKg}
              onChange={e => setBarraKg(Number(e.target.value))}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {BARRAS.map(b => (
                <option key={b.kg} value={b.kg}>{b.etiqueta}</option>
              ))}
            </select>
          </div>
        </div>

        {objetivo !== '' && carga === null && (
          <p style={{ fontSize: 13, color: '#F59E0B', marginTop: 12 }}>
            Ese peso no llega ni a la barra vacía ({barraKg} kg).
          </p>
        )}

        {carga && (
          <div style={{
            marginTop: 14, padding: '14px 16px', borderRadius: 12,
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
          }}>
            <p style={{ ...etiquetaStyle, marginBottom: 9 }}>
              Por lado {carga.kgPorLado > 0 && `· ${carga.kgPorLado} kg`}
            </p>
            <ListaDeDiscos carga={carga} />
            <div style={{ marginTop: 11, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <Resultado carga={carga} />
              <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                · {kgALb(carga.totalKg)} lb
              </span>
            </div>
          </div>
        )}

        {carga && (
          <div style={{ marginTop: 16 }}>
            <label htmlFor="discos-cargado" style={etiquetaStyle}>
              ¿Ya cargaste algo? (kg por lado)
            </label>
            <input
              id="discos-cargado"
              type="number" inputMode="decimal" step="0.5" min="0"
              value={cargado}
              onChange={e => setCargado(e.target.value)}
              placeholder="20"
              style={inputStyle}
            />

            {faltante && (
              <div style={{ marginTop: 11 }}>
                {faltante.yaEsta && (
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: '#22C55E', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Check size={15} /> Ya está en {objetivoKg} kg. No agregues nada.
                  </p>
                )}

                {faltante.sePaso && (
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={15} />
                    Te pasaste por {Math.abs(faltante.faltaKgTotal)} kg. Saca {Math.abs(faltante.faltaKgPorLado)} kg por lado.
                  </p>
                )}

                {!faltante.yaEsta && !faltante.sePaso && (
                  <>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                      Faltan {faltante.faltaKgPorLado} kg por lado
                    </p>
                    <p style={{ fontSize: 12.5, color: 'var(--color-text-3)', marginTop: 2 }}>
                      {faltante.faltaKgTotal} kg en total · {faltante.faltaLbTotal} lb
                    </p>
                    {faltante.agregar && (
                      <div style={{ marginTop: 9 }}>
                        <p style={{ ...etiquetaStyle, marginBottom: 7 }}>Agrega por lado</p>
                        <ListaDeDiscos carga={faltante.agregar} />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
