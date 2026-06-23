import { RegistroForm } from './RegistroForm'
import Link from 'next/link'

export const metadata = { title: 'Crear cuenta' }

export default function RegistroPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0D1117',
      padding: '40px 24px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 36 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>T</span>
        </div>
        <span style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '0.04em', fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)' }}>THRYRA</span>
      </div>

      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#EDF0F7', letterSpacing: '-0.04em', marginBottom: 6 }}>
            Empieza gratis
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            30 días gratis. Sin tarjeta de crédito.
          </p>
        </div>

        <div style={{
          background: '#13181F',
          border: '1px solid #252D3A',
          borderRadius: 16,
          padding: 28,
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}>
          <RegistroForm />
        </div>

        <p style={{ textAlign: 'center', fontSize: 13.5, color: 'rgba(255,255,255,0.35)', marginTop: 24 }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: '#818CF8', textDecoration: 'none', fontWeight: 600 }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
