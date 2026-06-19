import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg)' }}>

      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-red)', letterSpacing: '-0.02em' }}>
            Entre Barras
          </span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: 14, color: 'var(--color-text-2)', textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
            <Link href="/registro" style={{
              fontSize: 14, fontWeight: 500,
              background: 'var(--color-red)', color: '#fff',
              padding: '6px 16px', borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
            }}>
              Comenzar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '96px 24px 64px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', marginBottom: 24,
          background: 'var(--color-red-muted)', color: 'var(--color-red)',
          fontSize: 13, fontWeight: 500, padding: '4px 12px',
          borderRadius: 'var(--radius-full)', border: '1px solid var(--color-red-border)',
        }}>
          Plataforma en desarrollo — Acceso beta
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 56px)', fontWeight: 700,
          lineHeight: 1.1, letterSpacing: '-0.03em',
          color: 'var(--color-text)', marginBottom: 20,
        }}>
          El sistema operativo<br />
          <span style={{ color: 'var(--color-red)' }}>para entrenadores</span>
        </h1>

        <p style={{ fontSize: 18, color: 'var(--color-text-2)', lineHeight: 1.6, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
          Gestiona atletas, programa entrenamientos, controla el cumplimiento
          y mide el progreso de tus clientes — desde una sola plataforma.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/registro" style={{
            background: 'var(--color-red)', color: '#fff',
            padding: '12px 28px', borderRadius: 'var(--radius-md)',
            fontWeight: 600, fontSize: 15, textDecoration: 'none',
            boxShadow: '0 1px 3px rgb(229 57 53 / 0.3)',
          }}>
            Empieza gratis — 30 días
          </Link>
          <Link href="/login" style={{
            background: 'var(--color-surface)', color: 'var(--color-text)',
            padding: '12px 28px', borderRadius: 'var(--radius-md)',
            fontWeight: 500, fontSize: 15, textDecoration: 'none',
            border: '1px solid var(--color-border)',
          }}>
            Ver demo
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 96px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: 24,
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: 'var(--color-text)' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-3)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

const FEATURES = [
  { icon: '👥', title: 'Gestión de atletas', desc: 'Ficha completa con datos personales, deportivos y médicos. Historial siempre disponible.' },
  { icon: '📋', title: 'Constructor de rutinas', desc: 'Drag & drop visual. Bloques, superseries, configuración por ejercicio.' },
  { icon: '⚡', title: 'WODs CrossFit', desc: 'AMRAP, EMOM, For Time, Tabata, Chipper. Timer integrado.' },
  { icon: '📅', title: 'Calendario deportivo', desc: 'Programa rutinas y WODs. Vista por día, semana y mes.' },
  { icon: '📊', title: 'Dashboard de retención', desc: 'Detecta atletas en riesgo de abandono antes de que desaparezcan.' },
  { icon: '📈', title: 'Historial de cargas', desc: 'Progresión histórica por ejercicio. PRs automáticos.' },
]
