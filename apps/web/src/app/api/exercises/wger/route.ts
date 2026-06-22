import { NextResponse } from 'next/server'

const BASE = 'https://wger.de/api/v2'

// category IDs en Wger
// 10=Abs  8=Arms  12=Back  14=Calves  15=Cardio  11=Chest  9=Legs  13=Shoulders

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? ''
  const offset   = searchParams.get('offset') ?? '0'
  const limit    = searchParams.get('limit') ?? '20'

  const params = new URLSearchParams({ format: 'json', language: '2', limit, offset })
  if (category) params.set('category', category)

  try {
    const res = await fetch(`${BASE}/exerciseinfo/?${params}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error(`Wger ${res.status}`)
    const json = await res.json()
    return NextResponse.json(json, {
      headers: { 'Cache-Control': 'public, s-maxage=3600' },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
