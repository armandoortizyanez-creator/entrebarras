import type { Metadata } from 'next'
import { WodsView } from './WodsView'
export const metadata: Metadata = { title: 'WODs' }
export default function WodsPage() {
  return <WodsView />
}
