'use client'

import { useQuery } from '@tanstack/react-query'
import { getRetentionReport, getSessionReport } from '@/lib/queries/reports'

const TYPE_LABELS: Record<string, string> = {
  routine: 'Rutinas',
  wod: 'WODs',
  rest: 'Descanso',
  event: 'Eventos',
}

export function ReportesView() {
  const { data: retention, isLoading: loadingRet } = useQuery({
    queryKey: ['retention-report'],
    queryFn: getRetentionReport,
  })

  const { data: sessions, isLoading: loadingSes } = useQuery({
    queryKey: ['session-report'],
    queryFn: getSessionReport,
  })

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', marginBottom: 28 }}>
        Reportes
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Retención */}
        <Section title="Retención de atletas" subtitle="Últimos 7 días de actividad">
          {loadingRet ? <Skeleton /> : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                <KPI label="Total atletas" value={retention?.total ?? 0} />
                <KPI label="Cumplimiento promedio" value={`${retention?.avgCompliance ?? 0}%`} />
              </div>

              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Distribución de riesgo
              </p>

              <RiskBar
                total={retention?.total ?? 1}
                active={retention?.active ?? 0}
                med={retention?.atRiskMed ?? 0}
                high={retention?.atRiskHigh ?? 0}
                never={retention?.never ?? 0}
              />

              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <Legend color="var(--color-success)" label={`Activos (${retention?.active ?? 0})`} />
                <Legend color="var(--color-warning)" label={`Riesgo medio (${retention?.atRiskMed ?? 0})`} />
                <Legend color="var(--color-error)" label={`Riesgo alto (${retention?.atRiskHigh ?? 0})`} />
                <Legend color="var(--color-border)" label={`Sin sesiones (${retention?.never ?? 0})`} />
              </div>
            </>
          )}
        </Section>

        {/* Sesiones */}
        <Section title="Sesiones (últimos 30 días)" subtitle="">
          {loadingSes ? <Skeleton /> : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                <KPI label="Total" value={sessions?.total ?? 0} />
                <KPI label="Tasa de completitud" value={`${sessions?.completionRate ?? 0}%`} accent={(sessions?.completionRate ?? 0) >= 70} />
                <KPI label="Completadas" value={sessions?.completed ?? 0} />
                <KPI label="Saltadas" value={sessions?.skipped ?? 0} />
              </div>

              {sessions?.byType && Object.keys(sessions.byType).length > 0 && (
                <>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                    Por tipo
                  </p>
                  {Object.entries(sessions.byType).map(([type, count]) => (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: 'var(--color-text-2)', width: 80 }}>{TYPE_LABELS[type] ?? type}</span>
                      <div style={{ flex: 1, height: 6, background: 'var(--color-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          background: 'var(--color-red)',
                          width: `${Math.round((count / (sessions?.total ?? 1)) * 100)}%`,
                        }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--color-text-3)', width: 30, textAlign: 'right' }}>{count}</span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </Section>
      </div>

      {/* Tabla de atletas en riesgo */}
      <Section title="Atletas en riesgo de abandono" subtitle="Ordenados por días sin entrenar">
        {loadingRet ? <Skeleton height={200} /> : (
          retention?.athletes && retention.athletes.filter(a => (a.days_since_last_workout ?? 99) >= 7).length > 0 ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--color-border)', marginBottom: 4 }}>
                {['Atleta', 'Sesiones 30d', 'Completadas', 'Riesgo'].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                ))}
              </div>
              {retention.athletes
                .filter(a => (a.days_since_last_workout ?? 99) >= 7)
                .slice(0, 20)
                .map((a, i) => {
                  const risk = (a.days_since_last_workout ?? 99) >= 14 ? 'Alto' : 'Medio'
                  const riskColor = risk === 'Alto' ? 'var(--color-error)' : 'var(--color-warning)'
                  const riskBg = risk === 'Alto' ? 'var(--color-error-bg)' : 'var(--color-warning-bg)'
                  const pct = a.scheduled_30d > 0 ? Math.round((a.completed_30d / a.scheduled_30d) * 100) : 0

                  return (
                    <div key={a.athlete_id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                          {a.first_name} {a.last_name}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                          {a.days_since_last_workout != null
                            ? `Sin entrenar hace ${a.days_since_last_workout} días`
                            : 'Sin sesiones registradas'}
                        </p>
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{a.scheduled_30d}</span>
                      <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{a.completed_30d} ({pct}%)</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: riskColor, background: riskBg, padding: '3px 10px', borderRadius: 'var(--radius-full)', display: 'inline-block' }}>
                        {risk}
                      </span>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-3)', fontSize: 14 }}>
              🎉 Sin atletas en riesgo de abandono. Todos están activos.
            </div>
          )
        )}
      </Section>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2 }}>{subtitle}</p>}
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

function KPI({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: accent ? 'var(--color-success)' : 'var(--color-text)' }}>{value}</p>
    </div>
  )
}

function RiskBar({ total, active, med, high, never }: { total: number; active: number; med: number; high: number; never: number }) {
  const pct = (n: number) => `${Math.round((n / Math.max(total, 1)) * 100)}%`
  return (
    <div style={{ height: 12, borderRadius: 6, overflow: 'hidden', display: 'flex', gap: 1 }}>
      {active > 0 && <div style={{ width: pct(active), background: 'var(--color-success)' }} />}
      {med > 0 && <div style={{ width: pct(med), background: 'var(--color-warning)' }} />}
      {high > 0 && <div style={{ width: pct(high), background: 'var(--color-error)' }} />}
      {never > 0 && <div style={{ width: pct(never), background: 'var(--color-border)' }} />}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{label}</span>
    </div>
  )
}

function Skeleton({ height = 100 }: { height?: number }) {
  return <div style={{ height, background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', animation: 'pulse 1.5s infinite' }} />
}
