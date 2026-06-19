import type { Metadata } from 'next'
import { ComingSoon } from '@/components/ComingSoon'
export const metadata: Metadata = { title: 'WODs' }
export default function WodsPage() {
  return <ComingSoon title="WODs" description="Diseña workouts del día: AMRAP, EMOM, For Time, Tabata y más." icon="⏱️" />
}
