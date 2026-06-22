import type { Metadata } from 'next'
import { RoutineBuilder } from './RoutineBuilder'

export const metadata: Metadata = { title: 'Editor de rutina' }

export default async function RoutineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RoutineBuilder routineId={id} />
}
