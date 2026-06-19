import { RegistroForm } from './RegistroForm'
import Link from 'next/link'

export const metadata = { title: 'Crear cuenta' }

export default function RegistroPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontWeight: 700, fontSize: 22, color: 'var(--color-red)', letterSpacing: '-0.02em' }}>
            Entre Barras
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text)', marginTop: 16, marginBottom: 8 }}>
            Crea tu espacio de entrenamiento
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-3)' }}>
            30 días gratis. Sin tarjeta de crédito.
          </p>
        </div>

        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: 28,
          boxShadow: 'var(--shadow-md)',
        }}>
          <RegistroForm />
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-text-3)', marginTop: 20 }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: 'var(--color-red)', textDecoration: 'none', fontWeight: 500 }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
