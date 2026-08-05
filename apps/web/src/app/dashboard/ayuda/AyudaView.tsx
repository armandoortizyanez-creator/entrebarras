'use client'

import { useState, useMemo } from 'react'
import { useUser } from '@/hooks/useUser'
import {
  HELP_CATEGORIES, getArticlesForRole, searchArticles,
  type HelpArticle, type HelpCategoryId, type HelpRole,
} from '@/lib/help/articles'
import {
  Search, ArrowLeft, ChevronRight, Lightbulb, HelpCircle, X,
  Rocket, Users, Dumbbell, Zap, ClipboardList, Percent, UserCog,
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Rocket, Users, Dumbbell, Zap, ClipboardList, Percent, UserCog,
}

const CATEGORY_ACCENT: Record<HelpCategoryId, string> = {
  'primeros-pasos': '#6366F1',
  'atletas':        '#0EA5E9',
  'rutinas':        '#22C55E',
  'wods':           '#F43F5E',
  'programacion':   '#F59E0B',
  'herramientas':   '#8B5CF6',
  'equipo':         '#14B8A6',
}

export function AyudaView() {
  const { isAthlete, isSuperAdmin, isPlatformAdmin, loading } = useUser()
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const role: HelpRole = isAthlete ? 'athlete' : (isSuperAdmin || isPlatformAdmin) ? 'admin' : 'coach'

  const myArticles = useMemo(() => getArticlesForRole(role), [role])
  const results = useMemo(() => searchArticles(myArticles, search), [myArticles, search])

  const openArticle = openId ? myArticles.find(a => a.id === openId) ?? null : null

  const visibleCategories = useMemo(
    () => HELP_CATEGORIES.filter(c => results.some(a => a.category === c.id)),
    [results]
  )

  if (loading) return <SkeletonLoader />

  /* ─── Article detail ─── */
  if (openArticle) {
    return <ArticleDetail article={openArticle} onBack={() => setOpenId(null)} />
  }

  /* ─── Index ─── */
  return (
    <div style={{ padding: '36px 40px', maxWidth: 900 }}>

      {/* Hero */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <HelpCircle size={18} color="#6366F1" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.04em' }}>
            Centro de ayuda
          </h1>
        </div>
        <p style={{ fontSize: 14.5, color: 'var(--color-text-2)', maxWidth: 560, lineHeight: 1.55 }}>
          {role === 'athlete'
            ? 'Todo lo que necesitas saber para seguir tus rutinas, registrar tus sesiones y llevar tus marcas.'
            : 'Guías paso a paso para gestionar atletas, armar rutinas, programar la semana y sacarle provecho a Thryra.'}
        </p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 26 }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar: rutina, WOD, PR, invitar atleta…"
          style={{
            width: '100%', padding: '12px 40px 12px 40px',
            border: '1px solid var(--color-border)', borderRadius: 12,
            fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)',
            boxSizing: 'border-box', outline: 'none',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            aria-label="Limpiar búsqueda"
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              borderRadius: 6, cursor: 'pointer', padding: 3,
              display: 'flex', alignItems: 'center', color: 'var(--color-text-2)',
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 16, padding: '54px 24px', textAlign: 'center',
        }}>
          <Search size={24} color="var(--color-text-4)" style={{ margin: '0 auto 10px' }} />
          <p style={{ fontSize: 14.5, color: 'var(--color-text-2)', fontWeight: 600, marginBottom: 4 }}>
            Sin resultados para “{search}”
          </p>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-3)' }}>
            Prueba con otra palabra, o revisa las categorías borrando la búsqueda.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {visibleCategories.map(cat => {
            const arts = results.filter(a => a.category === cat.id)
            const Icon = CATEGORY_ICONS[cat.icon] ?? HelpCircle
            const accent = CATEGORY_ACCENT[cat.id]

            return (
              <section key={cat.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: `${accent}1A`, border: `1px solid ${accent}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={14} color={accent} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                      {cat.label}
                    </h2>
                    <p style={{ fontSize: 12.5, color: 'var(--color-text-3)' }}>{cat.description}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {arts.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setOpenId(a.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                        borderRadius: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                        transition: 'border-color 0.12s, transform 0.12s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = accent }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 650, color: 'var(--color-text)', marginBottom: 3 }}>
                          {a.title}
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.45 }}>
                          {a.summary}
                        </p>
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                        fontSize: 11.5, color: 'var(--color-text-3)', fontWeight: 600,
                      }}>
                        {a.steps.length} pasos
                        <ChevronRight size={14} />
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* Footer note */}
      <div style={{
        marginTop: 34, padding: '16px 18px',
        background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
        borderRadius: 12, display: 'flex', gap: 11, alignItems: 'flex-start',
      }}>
        <Lightbulb size={16} color="#C6FF00" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: 'var(--color-text-2)', lineHeight: 1.55 }}>
          ¿No encuentras lo que buscas? Escríbele a tu administrador del box o contáctanos y lo agregamos a esta guía.
        </p>
      </div>
    </div>
  )
}

/* ══════════════════ ARTICLE DETAIL ══════════════════ */
function ArticleDetail({ article, onBack }: { article: HelpArticle; onBack: () => void }) {
  const cat = HELP_CATEGORIES.find(c => c.id === article.category)
  const accent = CATEGORY_ACCENT[article.category]

  return (
    <div style={{ padding: '36px 40px', maxWidth: 760 }}>
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: 'var(--color-text-2)', fontWeight: 500,
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 0, marginBottom: 22,
        }}
      >
        <ArrowLeft size={15} />
        Volver al centro de ayuda
      </button>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        {cat && (
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: accent, background: `${accent}1A`, border: `1px solid ${accent}33`,
            padding: '3px 9px', borderRadius: 20, marginBottom: 12,
          }}>
            {cat.label}
          </span>
        )}
        <h1 style={{ fontSize: 25, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.04em', marginBottom: 8, lineHeight: 1.25 }}>
          {article.title}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--color-text-2)', lineHeight: 1.6 }}>
          {article.summary}
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {article.steps.map((step, i) => {
          const isLast = i === article.steps.length - 1
          return (
            <div key={i} style={{ display: 'flex', gap: 15 }}>
              {/* Rail */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: accent, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                {!isLast && (
                  <div style={{ width: 2, flex: 1, background: 'var(--color-border)', minHeight: 12 }} />
                )}
              </div>

              {/* Content */}
              <div style={{ paddingBottom: isLast ? 0 : 22, flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 5, marginTop: 3 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.65 }}>
                  {step.body}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tips */}
      {article.tips && article.tips.length > 0 && (
        <div style={{
          marginTop: 30, background: 'var(--color-surface)',
          border: '1px solid var(--color-border)', borderRadius: 14, padding: '18px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <Lightbulb size={15} color="#C6FF00" />
            <span style={{
              fontSize: 11.5, fontWeight: 700, color: 'var(--color-text)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Bueno saber
            </span>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 9, listStyle: 'none', padding: 0, margin: 0 }}>
            {article.tips.map((tip, i) => (
              <li key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <span style={{
                  width: 4, height: 4, borderRadius: '50%', background: '#C6FF00',
                  flexShrink: 0, marginTop: 8,
                }} />
                <span style={{ fontSize: 13.5, color: 'var(--color-text-2)', lineHeight: 1.6 }}>
                  {tip}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onBack}
        style={{
          marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13.5, color: 'var(--color-text-2)', fontWeight: 500,
          background: 'transparent', border: '1px solid var(--color-border)',
          borderRadius: 10, padding: '9px 16px', cursor: 'pointer',
        }}
      >
        <ArrowLeft size={14} />
        Ver todas las guías
      </button>
    </div>
  )
}

function SkeletonLoader() {
  return (
    <div style={{ padding: '36px 40px', maxWidth: 900 }}>
      <div style={{ height: 30, width: 240, background: 'var(--color-surface-2)', borderRadius: 8, marginBottom: 14 }} />
      <div style={{ height: 44, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, marginBottom: 26 }} />
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ height: 68, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, marginBottom: 10 }} />
      ))}
    </div>
  )
}
