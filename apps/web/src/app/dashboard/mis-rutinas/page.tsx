import { MisRutinasView } from './MisRutinasView'

export const metadata = { title: 'Mis Rutinas' }

export default function MisRutinasPage() {
  return (
    <div className="eb-page">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em',
          color: 'var(--color-text)', lineHeight: 1.1, marginBottom: 6,
        }}>
          Mis Rutinas
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-3)' }}>
          Rutinas asignadas por tu coach
        </p>
      </div>
      <MisRutinasView />
    </div>
  )
}
