import { MiRutinaDetailView } from './MiRutinaDetailView'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Rutina' }

export default async function MiRutinaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div style={{ padding: '0 0 48px' }}>
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/dashboard/mis-rutinas"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, color: 'var(--color-text-3)',
            textDecoration: 'none', marginBottom: 16,
          }}
        >
          <ArrowLeft size={14} />
          Mis Rutinas
        </Link>
      </div>
      <MiRutinaDetailView id={id} />
    </div>
  )
}
