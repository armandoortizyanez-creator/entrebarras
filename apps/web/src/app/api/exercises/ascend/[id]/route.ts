import { NextResponse } from 'next/server'

const API_KEY = process.env.ASCENDAPI_KEY
const API_HOST = 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com'
const BASE = `https://${API_HOST}/api/v1`

const headers = () => ({
  'x-rapidapi-key': API_KEY!,
  'x-rapidapi-host': API_HOST,
  'Content-Type': 'application/json',
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!API_KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const { id } = await params

  try {
    const res = await fetch(`${BASE}/exercises/${id}`, {
      headers: headers(),
      next: { revalidate: 86400 },
    })
    if (!res.ok) throw new Error(`AscendAPI ${res.status}`)
    const json = await res.json()
    return NextResponse.json(json, {
      headers: { 'Cache-Control': 'public, s-maxage=86400' },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
