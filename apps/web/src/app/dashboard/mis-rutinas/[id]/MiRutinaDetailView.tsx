'use client'

import { useQuery } from '@tanstack/react-query'
import { getRoutine } from '@/lib/queries/routines'
import { useTheme } from '@/hooks/useTheme'
import Link from 'next/link'
import { ArrowLeft, Dumbbell, Tag, Layers, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { AutoLinkedText, BlockLinkList, normalizeLinks } from '@/components/routines/BlockContent'

const ACCENT = '#6366F1'
const VIOLET = '#7C3AED'

const TYPE_LABELS: Record<string, string> = {
  strength: 'Fuerza', hypertrophy: 'Hipertrofia', cardio: 'Cardio',
  crossfit: 'CrossFit', hyrox: 'Hyrox', mobility: 'Movilidad', custom: 'Personalizada',
}

const BLOCK_TYPE_LABELS: Record<string, string> = {
  standard: 'General', warmup: 'Calentamiento', strength: 'Fuerza', wod: 'WOD',
  emom: 'EMOM', superset: 'Superserie', circuit: 'Circuito',
  accessory: 'Accesorio', cooldown: 'Vuelta a la calma',
  amrap: 'AMRAP', for_time: 'For Time',
}

const BLOCK_COLORS: Record<string, { border: string; bg: string; badge: string }> = {
  standard:  { border: '#64748B', bg: 'rgba(100,116,139,0.10)', badge: '#94A3B8' },
  warmup:    { border: '#F59E0B', bg: 'rgba(245,158,11,0.10)',  badge: '#FBBF24' },
  strength:  { border: '#3B82F6', bg: 'rgba(59,130,246,0.10)',  badge: '#60A5FA' },
  wod:       { border: '#F43F5E', bg: 'rgba(244,63,94,0.10)',   badge: '#FB7185' },
  emom:      { border: '#8B5CF6', bg: 'rgba(139,92,246,0.10)',  badge: '#A78BFA' },
  superset:  { border: '#10B981', bg: 'rgba(16,185,129,0.10)',  badge: '#34D399' },
  circuit:   { border: '#F97316', bg: 'rgba(249,115,22,0.10)',  badge: '#FB923C' },
  accessory: { border: '#22C55E', bg: 'rgba(34,197,94,0.10)',   badge: '#4ADE80' },
  cooldown:  { border: '#0EA5E9', bg: 'rgba(14,165,233,0.10)',  badge: '#38BDF8' },
  amrap:     { border: '#818CF8', bg: 'rgba(129,140,248,0.10)', badge: '#818CF8' },
  for_time:  { border: '#C6FF00', bg: 'rgba(198,255,0,0.08)',   badge: '#A3B800' },
}

function ExerciseRow({ ex, isLast }: { ex: any; isLast: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '14px 20px',
      borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: 'var(--color-surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Dumbbell size={16} color="var(--color-text-3)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
          {ex.exercise?.name ?? 'Ejercicio'}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ex.sets && (
            <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-text-2)' }}>{ex.sets}</span> series
            </span>
          )}
          {ex.reps && (
            <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-text-2)' }}>{ex.reps}</span> reps
            </span>
          )}
          {ex.weight_kg && (
            <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-text-2)' }}>{ex.weight_kg}</span> kg
            </span>
          )}
          {ex.rest_seconds && (
            <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
              desc. <span style={{ fontWeight: 700, color: 'var(--color-text-2)' }}>{ex.rest_seconds}</span>s
            </span>
          )}
          {ex.rpe && (
            <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
              RPE <span style={{ fontWeight: 700, color: 'var(--color-text-2)' }}>{ex.rpe}</span>
            </span>
          )}
          {ex.exercise?.muscle_group && (
            <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontStyle: 'italic' }}>
              {ex.exercise.muscle_group}
            </span>
          )}
        </div>
        {ex.notes && (
          <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 6, fontStyle: 'italic' }}>
            {ex.notes}
          </p>
        )}
      </div>
    </div>
  )
}

function BlockCard({ block, index }: { block: any; index: number }) {
  const [open, setOpen] = useState(true)
  const colors = BLOCK_COLORS[block.type] ?? BLOCK_COLORS.standard

  const content: string = (block.content ?? '').trim()
  const links = normalizeLinks(block.links)
  const hasText = content.length > 0
  // Rutinas creadas antes del cuaderno libre siguen mostrando sus ejercicios
  const legacyExercises = !hasText && block.exercises?.length > 0

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1px solid var(--color-border)`,
      borderLeft: `4px solid ${colors.border}`,
      borderRadius: 16, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 20px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: colors.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, color: colors.border,
        }}>
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{
              fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em',
              color: 'var(--color-text)',
            }}>
              {block.name || BLOCK_TYPE_LABELS[block.type] || 'Bloque'}
            </p>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '2px 7px', borderRadius: 20,
              background: colors.bg, color: colors.badge,
              border: `1px solid ${colors.border}30`,
            }}>
              {BLOCK_TYPE_LABELS[block.type] ?? block.type}
            </span>
            {legacyExercises && (
              <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                {block.exercises.length} ejercicio{block.exercises.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {block.notes && (
            <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 3 }}>{block.notes}</p>
          )}
        </div>
        {open
          ? <ChevronUp size={16} color="var(--color-text-3)" style={{ flexShrink: 0 }} />
          : <ChevronDown size={16} color="var(--color-text-3)" style={{ flexShrink: 0 }} />
        }
      </button>

      {open && hasText && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '16px 20px' }}>
          <AutoLinkedText text={content} />
          <BlockLinkList links={links} />
        </div>
      )}

      {open && !hasText && links.length > 0 && (
        <div style={{ borderTop: '1px solid var(--color-border)', padding: '14px 20px' }}>
          <BlockLinkList links={links} />
        </div>
      )}

      {open && legacyExercises && (
        <div style={{ borderTop: '1px solid var(--color-border)' }}>
          {block.exercises.map((ex: any, i: number) => (
            <ExerciseRow key={ex.id} ex={ex} isLast={i === block.exercises.length - 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function MiRutinaDetailView({ id }: { id: string }) {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  const { data: routine, isLoading, error } = useQuery({
    queryKey: ['routine', id],
    queryFn: () => getRoutine(id),
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            height: 80, borderRadius: 16,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      </div>
    )
  }

  if (error || !routine) {
    return (
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 16, padding: '48px 32px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 14, color: 'var(--color-text-3)' }}>
          No se pudo cargar la rutina. Intenta de nuevo.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header card */}
      <div style={{
        background: `linear-gradient(135deg, ${ACCENT}18, ${VIOLET}18)`,
        border: `1px solid ${ACCENT}30`,
        borderRadius: 20, padding: '24px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, flexShrink: 0,
            background: `linear-gradient(135deg, ${ACCENT}, ${VIOLET})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 6px 20px ${ACCENT}40`,
          }}>
            <Dumbbell size={26} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em',
              color: 'var(--color-text)', marginBottom: 8,
            }}>
              {routine.name}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {routine.type && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 700,
                  background: `${ACCENT}20`, color: ACCENT,
                  padding: '3px 10px', borderRadius: 20,
                  border: `1px solid ${ACCENT}40`,
                }}>
                  <Tag size={9} />
                  {TYPE_LABELS[routine.type] ?? routine.type}
                </span>
              )}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: 'var(--color-text-3)',
              }}>
                <Layers size={12} />
                {routine.blocks.length} bloque{routine.blocks.length !== 1 ? 's' : ''}
              </span>
            </div>
            {routine.description && (
              <p style={{
                fontSize: 14, color: 'var(--color-text-2)', marginTop: 10,
                lineHeight: 1.6,
              }}>
                {routine.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Blocks */}
      {routine.blocks.length === 0 ? (
        <div style={{
          background: 'var(--color-surface)', border: '1.5px dashed var(--color-border)',
          borderRadius: 16, padding: '40px 24px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: 'var(--color-text-3)' }}>Esta rutina no tiene bloques aún.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {routine.blocks.map((block: any, i: number) => (
            <BlockCard key={block.id} block={block} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
