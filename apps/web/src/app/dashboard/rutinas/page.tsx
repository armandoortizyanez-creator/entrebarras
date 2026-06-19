import type { Metadata } from 'next'
import { RutinasView } from './RutinasView'
export const metadata: Metadata = { title: 'Rutinas' }
export default function RutinasPage() {
  return <RutinasView />
}
