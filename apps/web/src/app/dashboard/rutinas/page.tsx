import type { Metadata } from 'next'
import { ComingSoon } from '@/components/ComingSoon'
export const metadata: Metadata = { title: 'Rutinas' }
export default function RutinasPage() {
  return <ComingSoon title="Rutinas" description="Crea y asigna planes de entrenamiento personalizados a tus atletas." icon="📋" />
}
