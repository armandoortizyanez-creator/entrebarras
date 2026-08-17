import type { Metadata } from 'next'
import { WodBuilder } from './WodBuilder'

// Neutro a proposito: a esta misma pagina entra un coach a editar y un atleta
// solo a ver y cronometrar.
export const metadata: Metadata = { title: 'WOD' }

export default async function WodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <WodBuilder wodId={id} />
}
