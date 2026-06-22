import { NextResponse } from 'next/server'

const API_KEY = process.env.ASCENDAPI_KEY
const API_HOST = 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com'
const BASE = `https://${API_HOST}/api/v1`

const headers = () => ({
  'x-rapidapi-key': API_KEY!,
  'x-rapidapi-host': API_HOST,
  'Content-Type': 'application/json',
})

export async function GET(req: Request) {
  if (!API_KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const bodyPart = searchParams.get('bodyPart') ?? ''
  const cursor   = searchParams.get('cursor') ?? ''
  const limit    = searchParams.get('limit') ?? '50'

  const params = new URLSearchParams({ limit })
  if (bodyPart) params.set('bodyPart', bodyPart)
  if (cursor)   params.set('cursor', cursor)

  try {
    const res = await fetch(`${BASE}/exercises?${params}`, {
      headers: headers(),
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error(`AscendAPI ${res.status}`)
    const json = await res.json()
    return NextResponse.json(json, {
      headers: { 'Cache-Control': 'public, s-maxage=3600' },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
