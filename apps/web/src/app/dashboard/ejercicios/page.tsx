import type { Metadata } from 'next'
import { ComingSoon } from '@/components/ComingSoon'
export const metadata: Metadata = { title: 'Ejercicios' }
export default function EjerciciosPage() {
  return <ComingSoon title="Biblioteca de ejercicios" description="Miles de ejercicios con GIFs animados, músculos trabajados y variantes." icon="🏋️" />
}
