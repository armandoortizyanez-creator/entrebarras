import type { Metadata } from 'next'
import { ComingSoon } from '@/components/ComingSoon'
export const metadata: Metadata = { title: 'Reportes' }
export default function ReportesPage() {
  return <ComingSoon title="Reportes" description="Métricas de cumplimiento, retención y progreso de tus atletas." icon="📊" />
}
