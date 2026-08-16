'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export interface Aviso {
  id: number
  texto: string
}

/* ──────────────────────────────────────────────────────────────────────────
   Emisor a nivel de módulo.

   El onError global de React Query vive en el MutationCache, fuera del árbol
   de React, así que no puede usar un hook ni un contexto. Un emisor simple
   permite avisar desde cualquier lado sin acoplar nada.
   ────────────────────────────────────────────────────────────────────────── */

type Escucha = (a: Aviso) => void
const escuchas = new Set<Escucha>()
let siguienteId = 1

export function mostrarError(texto: string) {
  const aviso = { id: siguienteId++, texto }
  escuchas.forEach(fn => fn(aviso))
}

export function Toaster() {
  const [avisos, setAvisos] = useState<Aviso[]>([])

  useEffect(() => {
    const alRecibir = (a: Aviso) => {
      // Máximo tres a la vez: si algo falla en bucle, no tapa la pantalla
      setAvisos(prev => [...prev.slice(-2), a])
      setTimeout(() => {
        setAvisos(prev => prev.filter(x => x.id !== a.id))
      }, 7000)
    }
    escuchas.add(alRecibir)
    return () => { escuchas.delete(alRecibir) }
  }, [])

  if (avisos.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(16px + env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 'min(440px, calc(100vw - 32px))',
        pointerEvents: 'none',
      }}
    >
      {avisos.map(a => (
        <div
          key={a.id}
          role="alert"
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            background: 'var(--color-surface)',
            border: '1px solid rgba(239,68,68,0.35)',
            borderLeft: '3px solid #EF4444',
            borderRadius: 12,
            padding: '12px 14px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.28)',
          }}
        >
          <AlertTriangle size={15} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{
            flex: 1,
            fontSize: 13.5,
            lineHeight: 1.5,
            color: 'var(--color-text)',
            wordBreak: 'break-word',
          }}>
            {a.texto}
          </p>
          <button
            className="eb-tap"
            onClick={() => setAvisos(prev => prev.filter(x => x.id !== a.id))}
            aria-label="Cerrar aviso"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-3)',
              display: 'flex',
              alignItems: 'center',
              padding: 2,
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
