import type { Metadata } from 'next'
import { AthleteDetail } from './AthleteDetail'

export const metadata: Metadata = { title: 'Perfil del atleta' }

export default async function AthleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AthleteDetail athleteId={id} />
}
