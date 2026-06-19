import type { Metadata } from 'next'
import { RoutineBuilder } from './RoutineBuilder'

export const metadata: Metadata = { title: 'Editor de rutina' }

export default function RoutineDetailPage({ params }: { params: { id: string } }) {
  return <RoutineBuilder routineId={params.id} />
}
