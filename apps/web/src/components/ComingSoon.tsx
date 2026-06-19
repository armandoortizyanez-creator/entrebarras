export function ComingSoon({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: string
}) {
  return (
    <div style={{
      padding: '32px 40px', maxWidth: 1200,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    }}>
      <h1 style={{
        fontSize: 22, fontWeight: 700, color: 'var(--color-text)',
        letterSpacing: '-0.02em', marginBottom: 32,
      }}>
        {title}
      </h1>

      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', padding: '56px 40px', textAlign: 'center',
        width: '100%',
      }}>
        <p style={{ fontSize: 36, marginBottom: 16 }}>{icon}</p>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text)', marginBottom: 10 }}>
          Próximamente
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-text-3)', maxWidth: 400, margin: '0 auto' }}>
          {description}
        </p>
      </div>
    </div>
  )
}
