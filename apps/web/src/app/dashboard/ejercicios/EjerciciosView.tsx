'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createExercise } from '@/lib/queries/exercises'
import { X, Dumbbell, Search, ChevronDown } from 'lucide-react'

// ── Wger types ────────────────────────────────────────────────────────────────
type WgerTranslation = { language: number; name: string; description: string }
type WgerMuscle     = { id: number; name: string; name_en: string }
type WgerEquipment  = { id: number; name: string }
type WgerImage      = { id: number; image: string; is_main: boolean; thumbnails: { medium?: string } | null }

type WgerExercise = {
  id: number
  category: { id: number; name: string }
  muscles: WgerMuscle[]
  muscles_secondary: WgerMuscle[]
  equipment: WgerEquipment[]
  images: WgerImage[]
  translations: WgerTranslation[]
}

// Nombre en inglés (language=2) con fallback al primero disponible
function getName(ex: WgerExercise): string {
  return ex.translations.find(t => t.language === 2)?.name
      ?? ex.translations[0]?.name
      ?? `Exercise #${ex.id}`
}

// Descripción en inglés (para traducir) o español (language=4)
function getDescription(ex: WgerExercise, lang: 'en' | 'es'): string {
  const langId = lang === 'es' ? 4 : 2
  const text = ex.translations.find(t => t.language === langId)?.description
            ?? ex.translations.find(t => t.language === 2)?.description
            ?? ''
  // Quitar tags HTML
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getMainImage(ex: WgerExercise): string | null {
  const main = ex.images.find(i => i.is_main) ?? ex.images[0]
  return main?.thumbnails?.medium ?? main?.image ?? null
}

// ── Catálogos Wger ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 11,  label: 'Pecho' },
  { id: 12,  label: 'Espalda' },
  { id: 13,  label: 'Hombros' },
  { id: 8,   label: 'Brazos' },
  { id: 9,   label: 'Piernas' },
  { id: 10,  label: 'Abdomen' },
  { id: 14,  label: 'Pantorrillas' },
  { id: 15,  label: 'Cardio' },
]

const EQUIPMENT_LABELS: Record<number, string> = {
  1: 'Barra', 2: 'Barra EZ', 3: 'Mancuernas', 4: 'Colchoneta',
  5: 'Swiss Ball', 6: 'Barra de dominadas', 7: 'Peso corporal',
  8: 'Banco', 9: 'Banco inclinado', 10: 'Kettlebell', 11: 'Banda elástica',
}

// ── Translation cache ─────────────────────────────────────────────────────────
function getCachedTranslation(id: string): string | null {
  try { return localStorage.getItem(`eb_desc_${id}`) } catch { return null }
}
function setCachedTranslation(id: string, t: string) {
  try { localStorage.setItem(`eb_desc_${id}`, t) } catch {}
}
async function translateText(id: string, text: string): Promise<string> {
  const cached = getCachedTranslation(id)
  if (cached) return cached
  if (!text) return ''
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`)
    const json = await res.json()
    const translated = (json[0] as [string, string][])?.map(p => p[0]).join('') ?? text
    setCachedTranslation(id, translated)
    return translated
  } catch { return text }
}

// ── Main view ─────────────────────────────────────────────────────────────────
export function EjerciciosView() {
  const [category, setCategory]   = useState<number | null>(null)
  const [equipFilter, setEquipFilter] = useState<number | null>(null)
  const [search, setSearch]       = useState('')
  const [exercises, setExercises] = useState<WgerExercise[]>([])
  const [total, setTotal]         = useState(0)
  const [offset, setOffset]       = useState(0)
  const [loading, setLoading]     = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selected, setSelected]   = useState<WgerExercise | null>(null)
  const [showModal, setShowModal] = useState(false)
  const qc = useQueryClient()
  const LIMIT = 20

  const fetchExercises = useCallback(async (cat: number | null, off: number, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true)
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(off) })
    if (cat) params.set('category', String(cat))
    try {
      const res  = await fetch(`/api/exercises/wger?${params}`)
      const json = await res.json()
      const list: WgerExercise[] = json?.results ?? []
      setTotal(json?.count ?? 0)
      setExercises(prev => append ? [...prev, ...list] : list)
    } catch { /* silencioso */ }
    finally { if (append) setLoadingMore(false); else setLoading(false) }
  }, [])

  useEffect(() => {
    setSearch(''); setEquipFilter(null); setOffset(0)
    fetchExercises(category, 0)
  }, [category, fetchExercises])

  function loadMore() {
    const next = offset + LIMIT
    setOffset(next)
    fetchExercises(category, next, true)
  }

  // Filtro cliente: búsqueda + equipamiento
  const filtered = exercises.filter(e => {
    const name = getName(e).toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase())
    const matchEquip  = !equipFilter || e.equipment.some(eq => eq.id === equipFilter)
    return matchSearch && matchEquip
  })

  // Equipamientos únicos del set cargado
  const uniqueEquip = [...new Map(exercises.flatMap(e => e.equipment).map(eq => [eq.id, eq])).values()]

  const hasFilters = category || search || equipFilter
  const hasMore    = offset + LIMIT < total && !search && !equipFilter

  return (
    <div className="eb-page" style={{ maxWidth: 1240 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>Ejercicios</h1>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-3)', marginTop: 3 }}>
            {loading ? 'Cargando...' : `${filtered.length} ejercicios`}
            {hasFilters && !loading && (
              <button onClick={() => { setCategory(null); setSearch(''); setEquipFilter(null) }}
                style={{ marginLeft: 10, fontSize: 12, color: 'var(--color-red)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Limpiar filtros
              </button>
            )}
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ background: 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '9px 18px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Dumbbell size={14} strokeWidth={2} /> Ejercicio personalizado
        </button>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <aside style={{ width: 196, flexShrink: 0, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '16px 12px', boxShadow: 'var(--shadow-card)', position: 'sticky', top: 24 }}>
          <FilterSection title="Categoría">
            <FilterBtn active={!category} onClick={() => setCategory(null)}>Todos</FilterBtn>
            {CATEGORIES.map(c => (
              <FilterBtn key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>{c.label}</FilterBtn>
            ))}
          </FilterSection>

          {uniqueEquip.length > 0 && (
            <FilterSection title="Equipamiento">
              <FilterBtn active={!equipFilter} onClick={() => setEquipFilter(null)}>Todos</FilterBtn>
              {uniqueEquip.map(eq => (
                <FilterBtn key={eq.id} active={equipFilter === eq.id} onClick={() => setEquipFilter(eq.id)}>
                  {EQUIPMENT_LABELS[eq.id] ?? eq.name}
                </FilterBtn>
              ))}
            </FilterSection>
          )}
        </aside>

        {/* Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Buscar ejercicio..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 14px 9px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', outline: 'none', boxShadow: 'var(--shadow-card)' }} />
          </div>

          {loading ? <SkeletonGrid /> : filtered.length === 0 ? (
            <EmptyExercises hasSearch={!!(search || equipFilter)} />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
                {filtered.map(ex => (
                  <ExerciseCard key={ex.id} exercise={ex} onClick={() => setSelected(ex)} />
                ))}
              </div>
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <button onClick={loadMore} disabled={loadingMore}
                    style={{ padding: '9px 24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', cursor: loadingMore ? 'not-allowed' : 'pointer', fontSize: 13.5, color: 'var(--color-text-2)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {loadingMore
                      ? <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--color-border)', borderTopColor: 'var(--color-red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      : <ChevronDown size={14} />}
                    Ver más ejercicios
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selected && <ExerciseDetailModal exercise={selected} onClose={() => setSelected(null)} />}
      {showModal && (
        <NewExerciseModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); qc.invalidateQueries({ queryKey: ['exercises'] }) }} />
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{children}</div>
    </div>
  )
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ textAlign: 'left', padding: '5px 8px', borderRadius: 6, fontSize: 12.5, cursor: 'pointer', border: 'none', color: active ? 'var(--color-red)' : 'var(--color-text-2)', background: active ? 'var(--color-red-muted)' : 'transparent', fontWeight: active ? 600 : 400, transition: 'background 0.1s, color 0.1s' }}>
      {children}
    </button>
  )
}

function ExerciseCard({ exercise, onClick }: { exercise: WgerExercise; onClick: () => void }) {
  const imgSrc = getMainImage(exercise)
  const name   = getName(exercise)

  return (
    <div onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s, transform 0.15s', boxShadow: 'var(--shadow-card)' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'var(--shadow-card-hover)'; el.style.borderColor = 'var(--color-border-2)'; el.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'var(--shadow-card)'; el.style.borderColor = 'var(--color-border)'; el.style.transform = 'translateY(0)' }}>
      {imgSrc ? (
        <img src={imgSrc} alt={name} loading="lazy" style={{ width: '100%', height: 116, objectFit: 'cover', display: 'block', background: 'var(--color-surface-2)' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
      ) : (
        <div style={{ height: 80, background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Dumbbell size={24} color="var(--color-text-4)" strokeWidth={1.5} />
        </div>
      )}
      <div style={{ padding: '10px 12px 11px' }}>
        <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3, marginBottom: 6 }}>{name}</p>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <Tag>{CATEGORIES.find(c => c.id === exercise.category.id)?.label ?? exercise.category.name}</Tag>
          {exercise.equipment[0] && <Tag muted>{EQUIPMENT_LABELS[exercise.equipment[0].id] ?? exercise.equipment[0].name}</Tag>}
        </div>
      </div>
    </div>
  )
}

function Tag({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span style={{ fontSize: 10.5, fontWeight: 500, color: muted ? 'var(--color-text-3)' : 'var(--color-text-2)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: '2px 7px', borderRadius: 'var(--radius-full)' }}>
      {children}
    </span>
  )
}

// ── Detail modal ──────────────────────────────────────────────────────────────
function ExerciseDetailModal({ exercise, onClose }: { exercise: WgerExercise; onClose: () => void }) {
  const [lang, setLang]             = useState<'en' | 'es'>('es')
  const [esDesc, setEsDesc]         = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)

  const name    = getName(exercise)
  const imgSrc  = getMainImage(exercise)
  const enDesc  = getDescription(exercise, 'en')
  const nativeEs = getDescription(exercise, 'es') // puede estar vacío

  useEffect(() => {
    // Si Wger tiene descripción en español, usarla directo
    if (nativeEs) { setEsDesc(nativeEs); return }
    // Si no, traducir desde inglés
    if (enDesc) {
      setTranslating(true)
      translateText(`wger_${exercise.id}`, enDesc).then(t => { setEsDesc(t); setTranslating(false) })
    }
  }, [exercise.id, enDesc, nativeEs])

  const displayDesc = lang === 'es' ? (esDesc ?? enDesc) : enDesc
  const hasDesc = !!displayDesc

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 580, maxHeight: '92vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)' }}>

        {/* Imagen */}
        <div style={{ position: 'relative', background: 'var(--color-surface-2)', borderRadius: '18px 18px 0 0', overflow: 'hidden', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {imgSrc
            ? <img src={imgSrc} alt={name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
            : <Dumbbell size={48} color="var(--color-text-4)" strokeWidth={1} />}
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', zIndex: 2 }}>
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        <div style={{ padding: '20px 24px 28px' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', marginBottom: 12 }}>{name}</h2>

          {/* Tags */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'var(--color-red-muted)', color: 'var(--color-red)' }}>
              {CATEGORIES.find(c => c.id === exercise.category.id)?.label ?? exercise.category.name}
            </span>
            {exercise.equipment.map(eq => (
              <span key={eq.id} style={{ fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-2)' }}>
                {EQUIPMENT_LABELS[eq.id] ?? eq.name}
              </span>
            ))}
          </div>

          {/* Músculos principales */}
          {exercise.muscles.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-3)', marginBottom: 6 }}>Músculos principales</p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {exercise.muscles.map(m => <Tag key={m.id}>{m.name_en || m.name}</Tag>)}
              </div>
            </div>
          )}

          {/* Músculos secundarios */}
          {exercise.muscles_secondary.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-3)', marginBottom: 6 }}>Músculos secundarios</p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {exercise.muscles_secondary.map(m => <Tag key={m.id} muted>{m.name_en || m.name}</Tag>)}
              </div>
            </div>
          )}

          {/* Descripción */}
          {hasDesc && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-3)' }}>Descripción</p>
                <div style={{ display: 'flex', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 20, padding: '2px 3px', gap: 2 }}>
                  {(['es', 'en'] as const).map(l => (
                    <button key={l} onClick={() => setLang(l)}
                      style={{ padding: '3px 10px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, background: lang === l ? 'var(--color-red)' : 'transparent', color: lang === l ? '#fff' : 'var(--color-text-3)', transition: 'all 0.15s' }}>
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              {translating && lang === 'es' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-3)', fontSize: 13 }}>
                  <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--color-border)', borderTopColor: 'var(--color-red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Traduciendo...
                </div>
              ) : (
                <p style={{ fontSize: 13.5, color: 'var(--color-text-2)', lineHeight: 1.6 }}>{displayDesc}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Skeleton + Empty ──────────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ height: 160, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', animation: 'pulse-skeleton 1.6s ease-in-out infinite' }} />
      ))}
    </div>
  )
}

function EmptyExercises({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '56px 24px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Dumbbell size={22} color="var(--color-text-3)" strokeWidth={1.5} />
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>{hasSearch ? 'Sin resultados' : 'Sin ejercicios'}</h3>
      <p style={{ fontSize: 13.5, color: 'var(--color-text-3)' }}>
        {hasSearch ? 'Prueba con otro término o cambia los filtros.' : 'Selecciona una categoría para explorar ejercicios.'}
      </p>
    </div>
  )
}

// ── New exercise modal ────────────────────────────────────────────────────────
const MUSCLE_GROUPS_ES = [
  { value: 'cuádriceps', label: 'Cuádriceps' }, { value: 'hombros', label: 'Hombros' },
  { value: 'pecho', label: 'Pecho' }, { value: 'abdominales', label: 'Abdominales' },
  { value: 'isquiotibiales', label: 'Isquiotibiales' }, { value: 'tríceps', label: 'Tríceps' },
  { value: 'bíceps', label: 'Bíceps' }, { value: 'dorsales', label: 'Dorsales' },
  { value: 'espalda baja', label: 'Espalda baja' }, { value: 'pantorrillas', label: 'Pantorrillas' },
  { value: 'glúteos', label: 'Glúteos' }, { value: 'cuello', label: 'Cuello' },
]

function NewExerciseModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm]     = useState({ name: '', description: '', muscle_group: '', equipment: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      await createExercise({ name: form.name, description: form.description || undefined, muscle_group: form.muscle_group || undefined, equipment: form.equipment || undefined, source: 'custom', is_public: false })
      onSuccess()
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error al guardar') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>Nuevo ejercicio personalizado</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nombre" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} required />
          <Field label="Descripción" value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>Grupo muscular</label>
              <select value={form.muscle_group} onChange={e => setForm(p => ({ ...p, muscle_group: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 13.5, color: 'var(--color-text)', background: 'var(--color-surface)' }}>
                <option value="">Sin definir</option>
                {MUSCLE_GROUPS_ES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>Equipamiento</label>
              <input value={form.equipment} onChange={e => setForm(p => ({ ...p, equipment: e.target.value }))} placeholder="ej. barra, mancuernas"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 13.5, color: 'var(--color-text)', background: 'var(--color-surface)' }} />
            </div>
          </div>
          {error && <p style={{ fontSize: 13, color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, cursor: 'pointer', background: 'transparent', color: 'var(--color-text)' }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', background: loading ? 'var(--color-border)' : 'var(--color-red)', color: loading ? 'var(--color-text-3)' : '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, required = false }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>
        {label}{required && <span style={{ color: 'var(--color-red)' }}> *</span>}
      </label>
      <input value={value} onChange={e => onChange(e.target.value)} required={required}
        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }} />
    </div>
  )
}
