'use client'

import { useEffect, useState } from 'react'
import { BARRAS, MODOS_DE_DISCOS } from '@/lib/discos'
import type { ModoDiscos } from '@/lib/discos'

const CLAVE = 'thryra.discos'

/**
 * Barra y modo de discos que eligió el atleta, recordados en su teléfono.
 *
 * Si hoy entrena con libras porque los discos de kilos están ocupados, lo va a
 * elegir una vez; no tiene sentido que la rutina y "Mis PRs" le pregunten de
 * nuevo cada vez que abre una. Y quien entrena siempre con la barra de 15 no
 * debería tener que cambiarla en cada pantalla.
 *
 * Se lee después de montar y no en el valor inicial: estas pantallas también
 * se renderizan en el servidor, donde no hay localStorage, y leerlo antes
 * haría que el HTML del servidor y el del teléfono no coincidieran.
 */
export function usePreferenciasDeDiscos() {
  const [modo, setModoEstado] = useState<ModoDiscos>('kg')
  const [barraKg, setBarraEstado] = useState(20)

  useEffect(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '{}')
      if (MODOS_DE_DISCOS.some(m => m.valor === guardado.modo)) setModoEstado(guardado.modo)
      if (BARRAS.some(b => b.kg === guardado.barraKg)) setBarraEstado(guardado.barraKg)
    } catch {
      // Navegador sin almacenamiento o dato corrupto: se queda con lo de fábrica.
    }
  }, [])

  const guardar = (valores: { modo: ModoDiscos; barraKg: number }) => {
    try { localStorage.setItem(CLAVE, JSON.stringify(valores)) } catch { /* sin almacenamiento */ }
  }

  const setModo = (m: ModoDiscos) => {
    setModoEstado(m)
    guardar({ modo: m, barraKg })
  }

  const setBarraKg = (b: number) => {
    setBarraEstado(b)
    guardar({ modo, barraKg: b })
  }

  return { modo, setModo, barraKg, setBarraKg }
}
