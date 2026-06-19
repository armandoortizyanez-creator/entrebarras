import type { Metadata } from 'next'
import { AthleteDetail } from './AthleteDetail'

export const metadata: Metadata = { title: 'Perfil del atleta' }

export default function AthleteDetailPage({ params }: { params: { id: string } }) {
  return <AthleteDetail athleteId={params.id} />
}
