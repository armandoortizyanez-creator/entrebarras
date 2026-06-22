import type { Metadata } from 'next'
import { WodBuilder } from './WodBuilder'

export const metadata: Metadata = { title: 'Editor de WOD' }

export default async function WodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <WodBuilder wodId={id} />
}
