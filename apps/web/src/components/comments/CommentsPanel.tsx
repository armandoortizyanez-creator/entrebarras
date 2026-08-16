'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getComments, addComment, deleteComment, updateComment,
  type CommentEntity, type CommentVisibility,
} from '@/lib/queries/comments'
import { useUser } from '@/hooks/useUser'
import { MessageSquare, Lock, Eye, Trash2, Send } from 'lucide-react'
import { mensajeDeError } from '@/lib/errors'

function tiempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `hace ${d} día${d !== 1 ? 's' : ''}`
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function CommentsPanel({ entityType, entityId, subjectLabel }: {
  entityType: CommentEntity
  entityId: string
  /** Cómo nombrar a quien podría leer un comentario compartido. */
  subjectLabel: string
}) {
  const { isAthlete } = useUser()
  const qc = useQueryClient()
  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState<CommentVisibility>('staff')
  const [error, setError] = useState('')

  const queryKey = ['comments', entityType, entityId]

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getComments(entityType, entityId),
  })

  const create = useMutation({
    mutationFn: () => addComment({ entityType, entityId, body, visibility }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      setBody('')
      setError('')
    },
    onError: (e: unknown) => setError(mensajeDeError(e, 'No se pudo guardar el comentario')),
  })

  const remove = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  const cambiarVisibilidad = useMutation({
    mutationFn: ({ id, v }: { id: string; v: CommentVisibility }) => updateComment(id, { visibility: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <MessageSquare size={15} color="var(--color-text-3)" />
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
          Comentarios
        </h3>
        {comments.length > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
            background: 'var(--color-surface-2)', color: 'var(--color-text-3)',
          }}>
            {comments.length}
          </span>
        )}
      </div>

      {/* Composer — solo staff escribe */}
      {!isAthlete && (
        <div style={{
          background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
          borderRadius: 12, padding: 12, marginBottom: 16,
        }}>
          <textarea
            value={body}
            onChange={e => { setBody(e.target.value); setError('') }}
            placeholder="Escribe una nota de seguimiento..."
            rows={3}
            style={{
              width: '100%', padding: '8px 10px', boxSizing: 'border-box',
              border: '1px solid var(--color-border)', borderRadius: 8,
              fontSize: 13.5, color: 'var(--color-text)', background: 'var(--color-surface)',
              outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.55,
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <VisibilityToggle value={visibility} onChange={setVisibility} subjectLabel={subjectLabel} />
            <div style={{ flex: 1 }} />
            <button
              onClick={() => create.mutate()}
              disabled={!body.trim() || create.isPending}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 15px', borderRadius: 9,
                fontSize: 13, fontWeight: 700,
                background: body.trim() ? '#6366F1' : 'var(--color-surface)',
                color: body.trim() ? '#fff' : 'var(--color-text-3)',
                cursor: body.trim() && !create.isPending ? 'pointer' : 'not-allowed',
                border: body.trim() ? 'none' : '1px solid var(--color-border)',
              }}
            >
              <Send size={12} />
              {create.isPending ? 'Guardando...' : 'Comentar'}
            </button>
          </div>

          {error && <p style={{ fontSize: 12.5, color: '#EF4444', marginTop: 8 }}>{error}</p>}
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <p style={{ fontSize: 13, color: 'var(--color-text-3)', padding: '8px 0' }}>Cargando comentarios...</p>
      ) : comments.length === 0 ? (
        <div style={{
          border: '1.5px dashed var(--color-border)', borderRadius: 12,
          padding: '28px 20px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-3)' }}>
            {isAthlete ? 'Tu coach aún no ha compartido comentarios.' : 'Sin comentarios todavía.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {comments.map(c => {
            const compartido = c.visibility === 'shared'
            return (
              <div
                key={c.id}
                style={{
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderLeft: `3px solid ${compartido ? '#22C55E' : '#94A3B8'}`,
                  borderRadius: 10, padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                    {c.author_name}
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--color-text-3)' }}>
                    {tiempoRelativo(c.created_at)}
                  </span>

                  <span
                    title={compartido
                      ? `Visible para ${subjectLabel}`
                      : 'Nota interna: solo la ve el staff del box'}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 10.5, fontWeight: 700, padding: '1.5px 7px', borderRadius: 20,
                      background: compartido ? 'rgba(34,197,94,0.12)' : 'var(--color-surface-2)',
                      color: compartido ? '#22C55E' : 'var(--color-text-3)',
                      border: `1px solid ${compartido ? 'rgba(34,197,94,0.25)' : 'var(--color-border)'}`,
                    }}
                  >
                    {compartido ? <Eye size={9} /> : <Lock size={9} />}
                    {compartido ? 'Compartido' : 'Interno'}
                  </span>

                  <div style={{ flex: 1 }} />

                  {!isAthlete && (
                    <>
                      <button
                        onClick={() => cambiarVisibilidad.mutate({ id: c.id, v: compartido ? 'staff' : 'shared' })}
                        title={compartido ? 'Volverlo interno' : `Compartirlo con ${subjectLabel}`}
                        style={{
                          fontSize: 11, padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
                          background: 'transparent', border: '1px solid var(--color-border)',
                          color: 'var(--color-text-3)', fontWeight: 600,
                        }}
                      >
                        {compartido ? 'Hacer interno' : 'Compartir'}
                      </button>
                      <button className="eb-tap"
                        onClick={() => { if (confirm('¿Eliminar este comentario?')) remove.mutate(c.id) }}
                        aria-label="Eliminar comentario"
                        style={{
                          padding: '3px 5px', borderRadius: 6, cursor: 'pointer',
                          background: 'transparent', border: '1px solid var(--color-border)',
                          color: 'var(--color-text-4)', display: 'flex', alignItems: 'center',
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </>
                  )}
                </div>

                <p style={{
                  fontSize: 13.5, color: 'var(--color-text-2)', lineHeight: 1.6,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {c.body}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function VisibilityToggle({ value, onChange, subjectLabel }: {
  value: CommentVisibility
  onChange: (v: CommentVisibility) => void
  subjectLabel: string
}) {
  const opciones: { v: CommentVisibility; label: string; icon: React.ReactNode; hint: string }[] = [
    { v: 'staff',  label: 'Interno',    icon: <Lock size={10} />, hint: 'Solo lo ve el staff del box' },
    { v: 'shared', label: 'Compartido', icon: <Eye size={10} />,  hint: `También lo ve ${subjectLabel}` },
  ]

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {opciones.map(o => {
        const activo = value === o.v
        return (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            title={o.hint}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 20, cursor: 'pointer',
              fontSize: 11.5, fontWeight: 700,
              background: activo
                ? (o.v === 'shared' ? 'rgba(34,197,94,0.12)' : 'rgba(99,102,241,0.10)')
                : 'transparent',
              border: `1px solid ${activo
                ? (o.v === 'shared' ? 'rgba(34,197,94,0.35)' : 'rgba(99,102,241,0.30)')
                : 'var(--color-border)'}`,
              color: activo
                ? (o.v === 'shared' ? '#22C55E' : '#6366F1')
                : 'var(--color-text-3)',
            }}
          >
            {o.icon}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
