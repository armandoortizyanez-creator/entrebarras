'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Percent, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react'
import { getMyAthlete } from '@/lib/queries/athletes'
import { getLatestPRs, percentageTable } from '@/lib/queries/prs'
import { zonasDePorcentaje } from '@/lib/prs-zonas'
import { useTheme } from '@/hooks/useTheme'
import { BARRAS, calcularCarga } from '@/lib/discos'
import { ListaDeDiscos } from './CalculadoraDeDiscos'

const ACCENT = '#6366F1'

const FECHA_CORTA = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' })

/** recorded_at viene como 'YYYY-MM-DD'. new Date() sobre eso lo lee como UTC y
 *  en Chile devuelve el dia anterior, asi que se arma la fecha a mano. */
function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  if (!a || !m || !d) return ''
  return FECHA_CORTA.format(new Date(a, m - 1, d))
}

/**
 * Los porcentajes del atleta, dentro de la rutina.
 *
 * Un bloque que dice "4 sets de 3 al 75%" no sirve de nada sin saber 75% de
 * que. Hasta ahora eso obligaba a salir de la rutina, entrar a "Mis PRs",
 * calcular, memorizar el numero y volver, en medio del entrenamiento y con el
 * telefono en la mano. Aca se elige el movimiento y la tabla aparece sin
 * moverse de la pantalla.
 *
 * Arranca cerrado y la consulta no se dispara hasta que se abre: la mayoria de
 * las veces el atleta entra a la rutina solo a leerla.
 */
export function PanelDePRs() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const zonas = zonasDePorcentaje(isLight)

  const [abierto, setAbierto] = useState(false)
  const [movimiento, setMovimiento] = useState('')

  // Tocar una fila muestra qué discos cargar para ese peso. Uno a la vez: en
  // el celular, doce filas abiertas serían una pared de texto.
  const [pctAbierto, setPctAbierto] = useState<number | null>(null)
  const [barraKg, setBarraKg] = useState(20)

  const { data: atleta } = useQuery({
    queryKey: ['my-athlete'],
    queryFn: () => getMyAthlete(),
    enabled: abierto,
  })

  // Misma clave que usa "Mis PRs": si el atleta registra una marca alla y
  // vuelve a la rutina, ve el numero nuevo sin recargar.
  const { data: marcas = [], isLoading } = useQuery({
    queryKey: ['prs', atleta?.id],
    queryFn: () => getLatestPRs(atleta!.id),
    enabled: abierto && !!atleta?.id,
  })

  // Derivado y no estado: si las marcas todavia no cargaron, o el movimiento
  // guardado ya no existe, cae solo en el primero de la lista.
  const elegido = marcas.some(m => m.movement_name === movimiento)
    ? movimiento
    : (marcas[0]?.movement_name ?? '')

  const marca = marcas.find(m => m.movement_name === elegido) ?? null
  const unoRM = marca ? Number(marca.estimated_1rm ?? marca.weight_kg) : null
  const tabla = unoRM ? percentageTable(unoRM) : null

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      <button
        onClick={() => setAbierto(a => !a)}
        aria-expanded={abierto}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0,
          background: ACCENT + '1E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Percent size={18} color={ACCENT} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: 'var(--color-text)' }}>
            Mis PRs
          </span>
          <span style={{ display: 'block', fontSize: 12.5, color: 'var(--color-text-3)' }}>
            Tus porcentajes de trabajo
          </span>
        </span>
        {abierto
          ? <ChevronUp size={18} color="var(--color-text-3)" style={{ flexShrink: 0 }} />
          : <ChevronDown size={18} color="var(--color-text-3)" style={{ flexShrink: 0 }} />}
      </button>

      {abierto && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '14px 18px 16px' }}>

          {isLoading && (
            <p style={{ fontSize: 13, color: 'var(--color-text-3)', textAlign: 'center', padding: '12px 0' }}>
              Cargando tus marcas...
            </p>
          )}

          {!isLoading && marcas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <p style={{ fontSize: 13.5, color: 'var(--color-text-2)', marginBottom: 10 }}>
                Todavía no tienes marcas registradas.
              </p>
              <Link
                href="/dashboard/calculadora"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 700, color: ACCENT, textDecoration: 'none',
                  border: '1px solid ' + ACCENT + '40', borderRadius: 10, padding: '8px 14px',
                }}
              >
                Registrar mi primer PR
                <ChevronRight size={15} />
              </Link>
            </div>
          )}

          {!isLoading && marcas.length > 0 && (
            <>
              <label
                htmlFor="panel-prs-movimiento"
                style={{
                  display: 'block', fontSize: 11, fontWeight: 700,
                  color: 'var(--color-text-3)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', marginBottom: 6,
                }}
              >
                Movimiento
              </label>
              <select
                id="panel-prs-movimiento"
                value={elegido}
                onChange={e => setMovimiento(e.target.value)}
                style={{
                  width: '100%', padding: '9px 11px',
                  border: '1px solid var(--color-border)', borderRadius: 10,
                  fontSize: 14, fontWeight: 600,
                  color: 'var(--color-text)', background: 'var(--color-surface)',
                  boxSizing: 'border-box', outline: 'none', cursor: 'pointer',
                }}
              >
                {marcas.map(m => (
                  <option key={m.id} value={m.movement_name}>
                    {m.movement_name} — {Number(m.estimated_1rm ?? m.weight_kg)} kg
                  </option>
                ))}
              </select>

              {marca && (
                <p style={{ fontSize: 12, color: 'var(--color-text-3)', margin: '8px 2px 0' }}>
                  {marca.reps > 1
                    ? Number(marca.weight_kg) + ' kg × ' + marca.reps + ' reps · 1RM estimado ' + unoRM + ' kg'
                    : Number(marca.weight_kg) + ' kg × 1 rep'}
                  {' · '}{fechaCorta(marca.recorded_at)}
                </p>
              )}

              {tabla && (
                <div style={{ marginTop: 12 }}>

                  {/* La barra cambia los discos, así que se elige antes. */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Barra
                    </span>
                    {BARRAS.map(b => (
                      <button
                        key={b.kg}
                        onClick={() => setBarraKg(b.kg)}
                        aria-pressed={barraKg === b.kg}
                        style={{
                          padding: '3px 11px', borderRadius: 999, cursor: 'pointer',
                          fontSize: 12, fontWeight: 700,
                          border: '1px solid ' + (barraKg === b.kg ? ACCENT + '60' : 'var(--color-border)'),
                          background: barraKg === b.kg ? ACCENT + '1E' : 'transparent',
                          color: barraKg === b.kg ? ACCENT : 'var(--color-text-3)',
                        }}
                      >
                        {b.etiqueta}
                      </button>
                    ))}
                  </div>

                  {tabla.map(fila => {
                    const zona = zonas[fila.pct]
                    const estaAbierta = pctAbierto === fila.pct
                    // Sobre el peso redondeado, no el exacto: es el que se puede
                    // armar de verdad con los discos que hay.
                    const carga = estaAbierta ? calcularCarga(fila.kg_rounded, barraKg) : null

                    return (
                      <div key={fila.pct} style={{ marginBottom: 3 }}>
                        <button
                          onClick={() => setPctAbierto(p => (p === fila.pct ? null : fila.pct))}
                          aria-expanded={estaAbierta}
                          style={{
                            width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none',
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '7px 10px',
                            borderRadius: estaAbierta ? '8px 8px 0 0' : 8,
                            background: zona?.bg ?? 'var(--color-bg)',
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 700, color: zona?.text ?? 'var(--color-text-2)', width: 42, flexShrink: 0 }}>
                            {fila.pct}%
                          </span>
                          <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--color-text)' }}>
                            {fila.kg_rounded} kg
                          </span>
                          <span style={{ fontSize: 11.5, color: 'var(--color-text-3)', flexShrink: 0 }}>
                            {fila.kg} kg
                          </span>
                          {zona?.label && (
                            <span style={{
                              fontSize: 10, fontWeight: 600, color: zona.text, flexShrink: 0,
                              background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.10)',
                              padding: '1px 6px', borderRadius: 10,
                            }}>
                              {zona.label}
                            </span>
                          )}
                        </button>

                        {estaAbierta && (
                          <div style={{
                            padding: '9px 10px 10px',
                            borderRadius: '0 0 8px 8px',
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border)', borderTop: 'none',
                          }}>
                            {carga ? (
                              <>
                                <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                                  Por lado{carga.kgPorLado > 0 ? ` · ${carga.kgPorLado} kg` : ''}
                                </p>
                                <ListaDeDiscos carga={carga} compacta />
                                {!carga.exacta && (
                                  <p style={{ fontSize: 11, color: '#F59E0B', marginTop: 6 }}>
                                    Lo más cerca: {carga.totalKg} kg
                                  </p>
                                )}
                              </>
                            ) : (
                              <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                                Menos que la barra de {barraKg} kg.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <p style={{ fontSize: 10.5, color: 'var(--color-text-3)', textAlign: 'center', marginTop: 8 }}>
                    Toca un porcentaje para ver qué discos cargar · Fórmula Epley
                  </p>
                </div>
              )}

              <Link
                href="/dashboard/calculadora"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  marginTop: 12, fontSize: 13, fontWeight: 700,
                  color: ACCENT, textDecoration: 'none',
                }}
              >
                Ver historial y registrar marcas
                <ChevronRight size={15} />
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
