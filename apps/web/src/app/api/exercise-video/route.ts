import { NextResponse } from 'next/server'

const API_KEY = process.env.ASCENDAPI_KEY
const API_HOST = 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com'
const BASE = `https://${API_HOST}/api/v1`

const rapidHeaders = () => ({
  'x-rapidapi-key': API_KEY!,
  'x-rapidapi-host': API_HOST,
  'Content-Type': 'application/json',
})

const MUSCLE_TO_BODYPART: Record<string, string> = {
  'pecho':          'CHEST',
  'hombros':        'SHOULDERS',
  'dorsales':       'BACK',
  'espalda media':  'BACK',
  'espalda baja':   'BACK',
  'trapecios':      'BACK',
  'bíceps':         'BICEPS',
  'tríceps':        'TRICEPS',
  'antebrazos':     'FOREARMS',
  'cuádriceps':     'QUADRICEPS',
  'isquiotibiales': 'HAMSTRINGS',
  'glúteos':        'HIPS',
  'aductores':      'THIGHS',
  'abductores':     'THIGHS',
  'pantorrillas':   'CALVES',
  'abdominales':    'WAIST',
  'cuello':         'NECK',
}

// Instancias Invidious verificadas (actualizar si fallan)
const INVIDIOUS_INSTANCES = [
  'https://yt.chocolatemoo53.com',
  'https://inv.thepixora.com',
  'https://invidious.tiekoetter.com',
]

// Jaccard similarity sobre palabras de 3+ letras
function nameSimilarity(a: string, b: string): number {
  const words = (s: string) =>
    new Set(s.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length >= 3))
  const wa = words(a)
  const wb = words(b)
  const intersection = [...wa].filter(w => wb.has(w)).length
  const union = new Set([...wa, ...wb]).size
  return union === 0 ? 0 : intersection / union
}

async function searchInvidious(query: string): Promise<string | null> {
  const encoded = encodeURIComponent(query + ' exercise tutorial')
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(
        `${instance}/api/v1/search?q=${encoded}&type=video&fields=videoId,title`,
        { signal: AbortSignal.timeout(6000) }
      )
      if (!res.ok) continue
      const json = await res.json()
      const videoId: string = json?.[0]?.videoId ?? ''
      if (videoId) return videoId
    } catch { continue }
  }
  return null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name') ?? ''
  const muscleGroup = searchParams.get('muscle_group') ?? ''

  if (!name) return NextResponse.json({ videoUrl: null, type: null })

  // ── Intento 1: AscendAPI — busca por bodyPart (name filter está roto en la API) ─
  if (API_KEY) {
    try {
      const bodyPart = MUSCLE_TO_BODYPART[muscleGroup.toLowerCase()] ?? ''

      if (bodyPart) {
        // Traer hasta 100 ejercicios del grupo muscular y hacer matching por nombre
        const res = await fetch(
          `${BASE}/exercises?bodyPart=${bodyPart}&limit=100`,
          { headers: rapidHeaders(), next: { revalidate: 86400 } }
        )

        if (res.ok) {
          const data = await res.json()
          const candidates: { exerciseId: string; name: string }[] = data?.data ?? []

          const best = candidates
            .map(c => ({ ...c, score: nameSimilarity(name, c.name) }))
            .sort((a, b) => b.score - a.score)[0]

          if (best && best.score >= 0.3) {
            const detailRes = await fetch(`${BASE}/exercises/${best.exerciseId}`, {
              headers: rapidHeaders(),
              next: { revalidate: 86400 },
            })
            if (detailRes.ok) {
              const detail = await detailRes.json()
              const videoUrl: string | null = detail?.data?.videoUrl ?? null
              if (videoUrl) {
                return NextResponse.json(
                  { videoUrl, type: 'mp4' },
                  { headers: { 'Cache-Control': 'public, max-age=86400' } }
                )
              }
            }
          }
        }
      }
    } catch { /* continuar con fallback */ }
  }

  // ── Fallback: Invidious (YouTube sin tracking) ────────────────────────────
  const youtubeId = await searchInvidious(name)
  if (youtubeId) {
    return NextResponse.json(
      { videoUrl: youtubeId, type: 'youtube' },
      { headers: { 'Cache-Control': 'public, max-age=3600' } }
    )
  }

  return NextResponse.json({ videoUrl: null, type: null })
}
