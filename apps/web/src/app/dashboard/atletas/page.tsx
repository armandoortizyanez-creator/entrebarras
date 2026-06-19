import type { Metadata } from 'next'
import { AthletesView } from './AthletesView'

export const metadata: Metadata = { title: 'Atletas' }

export default function AthletesPage() {
  return <AthletesView />
}
