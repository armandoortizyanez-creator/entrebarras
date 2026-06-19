import type { Metadata } from 'next'
import { ComingSoon } from '@/components/ComingSoon'
export const metadata: Metadata = { title: 'Calendario' }
export default function CalendarioPage() {
  return <ComingSoon title="Calendario" description="Asigna y visualiza los entrenamientos de todos tus atletas en un solo lugar." icon="📅" />
}
