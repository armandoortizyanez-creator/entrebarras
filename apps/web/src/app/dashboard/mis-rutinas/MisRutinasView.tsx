'use client'

import { useQuery } from '@tanstack/react-query'
import { getMyAssignedRoutines } from '@/lib/queries/routines'
import { useTheme } from '@/hooks/useTheme'
import Link from 'next/link'
import { Dumbbell, ChevronRight, Layers, Tag, Calendar } from 'lucide-react'

const ACCENT = '#6366F1'
const VIOLET = '#7C3AED'

const TYPE_LABELS: Record<string, string> = {
  strength: 'Fuerza', hypertrophy: 'Hipertrofia', cardio: 'Cardio',
  crossfit: 'CrossFit', hyrox: 'Hyrox', mobility: 'Movilidad', custom: 'Personalizada',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function MisRutinasView() {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const { data: routines = [], isLoading } = useQuery({
    queryKey: ['my-assigned-routines'],
    queryFn: getMyAssignedRoutines,
  })

  const surfBorder = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            height: 100, borderRadius: 16,
            background: 'var(--color-surface)',
            border: `1px solid ${surfBorder}`,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      </div>
    )
  }

  if (routines.length === 0) {
    return (
      <div style={{
        background: 'var(--color-surface)',
        border: `1.5px dashed ${surfBorder}`,
        borderRadius: 20, padding: '56px 32px', textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: `linear-gradient(135deg, ${ACCENT}22, ${VIOLET}22)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Dumbbell size={28} color={ACCENT} />
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
          Sin rutinas asignadas
        </p>
        <p style={{ fontSize: 14, color: 'var(--color-text-3)', lineHeight: 1.6 }}>
          Tu coach aún no te ha asignado ninguna rutina.<br />Consulta con ellos para comenzar.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 4 }}>
        {routines.length} rutina{routines.length !== 1 ? 's' : ''} asignada{routines.length !== 1 ? 's' : ''}
      </p>

      {routines.map(r => (
        <Link
          key={r.id}
          href={`/dashboard/mis-rutinas/${r.id}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 16,
            background: 'var(--color-surface)',
            border: `1px solid ${surfBorder}`,
            borderLeft: `4px solid ${ACCENT}`,
            borderRadius: 16, padding: '20px 24px',
            textDecoration: 'none',
            transition: 'box-shadow 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.boxShadow = 'var(--shadow-card-hover)'
            el.style.transform = 'translateX(3px)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.boxShadow = 'none'
            el.style.transform = 'translateX(0)'
          }}
        >
          {/* Icon */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: `linear-gradient(135deg, ${ACCENT}22, ${VIOLET}22)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Dumbbell size={24} color={ACCENT} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 16, fontWeight: 800, color: 'var(--color-text)',
              letterSpacing: '-0.02em', marginBottom: 6,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {r.name}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {r.type && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 600,
                  background: `${ACCENT}18`, color: ACCENT,
                  padding: '2px 8px', borderRadius: 20,
                  border: `1px solid ${ACCENT}30`,
                }}>
                  <Tag size={9} />
                  {TYPE_LABELS[r.type] ?? r.type}
                </span>
              )}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: 'var(--color-text-3)',
              }}>
                <Layers size={12} />
                {r.blocks_count} bloque{r.blocks_count !== 1 ? 's' : ''}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: 'var(--color-text-3)',
              }}>
                <Calendar size={12} />
                Asignada {formatDate(r.assigned_at)}
              </span>
            </div>
            {r.description && (
              <p style={{
                fontSize: 13, color: 'var(--color-text-3)', marginTop: 6,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {r.description}
              </p>
            )}
          </div>

          {/* Arrow */}
          <ChevronRight size={20} color="var(--color-text-3)" style={{ flexShrink: 0 }} />
        </Link>
      ))}
    </div>
  )
}
