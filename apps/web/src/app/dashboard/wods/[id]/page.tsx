import type { Metadata } from 'next'
import { WodBuilder } from './WodBuilder'

export const metadata: Metadata = { title: 'Editor de WOD' }

export default function WodDetailPage({ params }: { params: { id: string } }) {
  return <WodBuilder wodId={params.id} />
}
