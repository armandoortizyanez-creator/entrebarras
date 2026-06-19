import type { Metadata } from 'next'
import { CalendarioView } from './CalendarioView'
export const metadata: Metadata = { title: 'Calendario' }
export default function CalendarioPage() {
  return <CalendarioView />
}
