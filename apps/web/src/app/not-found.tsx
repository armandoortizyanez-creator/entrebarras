import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '404 — Página no encontrada' }

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D1117',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      textAlign: 'center',
      fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)',
    }}>
      {/* Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logos/logo-main.png" alt="THRYRA" style={{ height: 28, width: 'auto', marginBottom: 56 }} />

      {/* 404 number */}
      <div style={{
        fontSize: 'clamp(80px, 20vw, 140px)',
        fontWeight: 800,
        letterSpacing: '-0.06em',
        lineHeight: 1,
        fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)',
        background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 50%, #C6FF00 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: 24,
        userSelect: 'none',
      }}>
        404
      </div>

      <h1 style={{
        fontSize: 22, fontWeight: 700,
        color: '#EDF0F7',
        letterSpacing: '-0.03em',
        marginBottom: 10,
        fontFamily: 'var(--font-montserrat, Montserrat, sans-serif)',
      }}>
        Página no encontrada
      </h1>

      <p style={{
        fontSize: 15, color: 'rgba(255,255,255,0.4)',
        maxWidth: 360, lineHeight: 1.6,
        marginBottom: 40,
      }}>
        La ruta que buscas no existe o fue movida. Regresa al dashboard para continuar entrenando.
      </p>

      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#C6FF00', color: '#0D1117',
          borderRadius: 12, padding: '12px 28px',
          fontWeight: 700, fontSize: 14,
          textDecoration: 'none',
          transition: 'opacity 0.15s',
        }}
      >
        Ir al Dashboard
      </Link>

      <Link
        href="/"
        style={{
          display: 'inline-flex', alignItems: 'center',
          marginTop: 16, fontSize: 13,
          color: 'rgba(255,255,255,0.35)',
          textDecoration: 'none',
        }}
      >
        o volver a inicio
      </Link>
    </div>
  )
}
