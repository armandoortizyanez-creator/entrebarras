import { LoginForm } from './LoginForm'
import Link from 'next/link'

export const metadata = { title: 'Iniciar sesión' }

const PHOTO = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&auto=format&fit=crop&q=85'

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: '#0D1117',
    }}>
      {/* Left — atmospheric image */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '48px',
      }}
        className="login-split-image"
      >
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${PHOTO})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(13,17,23,0.2) 0%, rgba(13,17,23,0.92) 100%)',
        }} />
        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C6FF00', marginBottom: 12 }}>
            Train. Evolve. Thrive.
          </p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.3, letterSpacing: '-0.03em', maxWidth: 320 }}>
            La plataforma de entrenamiento para coaches de LATAM.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 56px',
        background: '#0D1117',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Logo */}
          <div style={{ marginBottom: 48 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/logo-dark-v3.png" alt="THRYRA" style={{ height: 32, width: 'auto' }} />
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#EDF0F7', letterSpacing: '-0.04em', marginBottom: 6 }}>
            Bienvenido de vuelta
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 36 }}>
            Ingresa con tu cuenta para continuar
          </p>

          <LoginForm />

          <p style={{ textAlign: 'center', fontSize: 13.5, color: 'rgba(255,255,255,0.35)', marginTop: 28 }}>
            ¿No tienes cuenta?{' '}
            <Link href="/registro" style={{ color: '#818CF8', textDecoration: 'none', fontWeight: 600 }}>
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-split-image { display: none; }
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
