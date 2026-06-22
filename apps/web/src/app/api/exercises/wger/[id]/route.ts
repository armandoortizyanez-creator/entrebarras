import { NextResponse } from 'next/server'

const BASE = 'https://wger.de/api/v2'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const res = await fetch(`${BASE}/exerciseinfo/${id}/?format=json`, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) throw new Error(`Wger ${res.status}`)
    const json = await res.json()
    return NextResponse.json(json, {
      headers: { 'Cache-Control': 'public, s-maxage=86400' },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
