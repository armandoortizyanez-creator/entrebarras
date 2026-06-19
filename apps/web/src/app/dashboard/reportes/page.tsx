import type { Metadata } from 'next'
import { ReportesView } from './ReportesView'
export const metadata: Metadata = { title: 'Reportes' }
export default function ReportesPage() {
  return <ReportesView />
}
