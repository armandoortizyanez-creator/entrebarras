import type { Metadata } from 'next'
import { ComingSoon } from '@/components/ComingSoon'
export const metadata: Metadata = { title: 'Configuración' }
export default function ConfiguracionPage() {
  return <ComingSoon title="Configuración" description="Personaliza tu organización, coaches, branding y plan de suscripción." icon="⚙️" />
}
