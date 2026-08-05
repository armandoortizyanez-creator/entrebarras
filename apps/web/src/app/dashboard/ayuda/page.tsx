import type { Metadata } from 'next'
import { AyudaView } from './AyudaView'
export const metadata: Metadata = { title: 'Centro de ayuda' }
export default function AyudaPage() {
  return <AyudaView />
}
