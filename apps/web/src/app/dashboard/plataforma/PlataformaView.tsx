'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllTenants, getTenantStats } from '@/lib/queries/team'
import { useUser } from '@/hooks/useUser'
import { Building2, Users, Dumbbell, CheckCircle, Shield, Search, Activity } from 'lucide-react'

const PLAN_STYLE: Record<string, { color: string; label: string }> = {
  trial:   { color: '#f59e0b', label: 'Trial' },
  starter: { color: '#2196f3', label: 'Starter' },
  growth:  { color: '#e91e8c', label: 'Growth' },
  pro:     { color: '#4caf50', label: 'Pro' },
}

interface TenantWithStats {
  id: string
  name: string
  slug: string
  plan_tier: string
  is_active: boolean
  created_at: string
  users?: number
  athletes?: number
  sessions?: number
}

export function PlataformaView() {
  const { isPlatformAdmin } = useUser()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['platform-tenants'],
    queryFn: getAllTenants,
    enabled: isPlatformAdmin,
  })

  if (!isPlatformAdmin) {
    return (
      <div style={{ padding: '64px 40px', textAlign: 'center' }}>
        <Shield size={40} style={{ color: '#6c63ff', marginBottom: 16 }} />
        <p style={{ color: 'var(--color-text-2)', fontSize: 15 }}>
          Solo el Super Super Admin puede acceder a este panel.
        </p>
      </div>
    )
  }

  const filtered = tenants.filter((t: TenantWithStats) => {
    const matchSearch = search === '' ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'active' ? t.is_active : !t.is_active)
    return matchSearch && matchFilter
  })

  const activeCount = tenants.filter((t: TenantWithStats) => t.is_active).length

  const s = {
    page:     { padding: isMobile ? '16px 16px 80px' : '32px 40px', maxWidth: 1200 },
    header:   { marginBottom: isMobile ? 16 : 28 },
    title:    { fontSize: isMobile ? 18 : 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' },
    sub:      { fontSize: 14, color: 'var(--color-text-3)', marginTop: 4 },
    statRow:  { display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 14, marginBottom: isMobile ? 16 : 28 },
    statCard: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: isMobile ? '14px 16px' : '18px 20px' },
    statNum:  { fontSize: isMobile ? 22 : 26, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.03em' },
    statLbl:  { fontSize: 11.5, color: 'var(--color-text-3)', marginTop: 3 },
    toolbar:  { display: 'flex', flexDirection: isMobile ? 'column' as const : 'row' as const, gap: 10, alignItems: isMobile ? 'stretch' : 'center', marginBottom: 20 },
    search:   { flex: 1, height: 40, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', color: 'var(--color-text)', padding: '0 12px', fontSize: 13.5 },
    tab:      (a: boolean) => ({
      padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: 'none',
      fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
      background: a ? 'var(--color-red)' : 'var(--color-surface)',
      color: a ? '#fff' : 'var(--color-text-2)',
    }),
    grid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 },
    card:     { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px' },
    cardHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
    tenName:  { fontSize: 15, fontWeight: 600, color: 'var(--color-text)' },
    slug:     { fontSize: 12, color: 'var(--color-text-3)', marginTop: 2 },
    planBadge:(plan: string) => ({
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      fontSize: 10.5, fontWeight: 700,
      background: `${PLAN_STYLE[plan]?.color ?? '#888'}22`,
      color: PLAN_STYLE[plan]?.color ?? '#888',
    }),
    metaRow:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' },
    metaCell: { textAlign: 'center' as const },
    metaNum:  { fontSize: 18, fontWeight: 700, color: 'var(--color-text)' },
    metaLbl:  { fontSize: 11, color: 'var(--color-text-3)', marginTop: 2 },
    statusDot:(active: boolean) => ({
      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500,
      color: active ? 'var(--color-success)' : 'var(--color-text-3)',
    }),
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Shield size={20} style={{ color: '#6c63ff' }} />
          <h1 style={s.title}>Panel de Plataforma</h1>
        </div>
        <p style={s.sub}>Visión global de todos los gimnasios y tenants activos</p>
      </div>

      {/* Stats */}
      <div style={s.statRow}>
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Building2 size={16} style={{ color: '#6c63ff' }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontWeight: 600 }}>GIMNASIOS</span>
          </div>
          <div style={s.statNum}>{tenants.length}</div>
          <div style={s.statLbl}>{activeCount} activos</div>
        </div>
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <CheckCircle size={16} style={{ color: '#4caf50' }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontWeight: 600 }}>ACTIVOS</span>
          </div>
          <div style={s.statNum}>{activeCount}</div>
          <div style={s.statLbl}>de {tenants.length} totales</div>
        </div>
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Activity size={16} style={{ color: '#e91e8c' }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontWeight: 600 }}>PLAN PRO</span>
          </div>
          <div style={s.statNum}>{tenants.filter((t: TenantWithStats) => t.plan_tier === 'pro').length}</div>
          <div style={s.statLbl}>gimnasios en Pro</div>
        </div>
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Dumbbell size={16} style={{ color: '#2196f3' }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-3)', fontWeight: 600 }}>TRIAL</span>
          </div>
          <div style={s.statNum}>{tenants.filter((t: TenantWithStats) => t.plan_tier === 'trial').length}</div>
          <div style={s.statLbl}>en período de prueba</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={s.toolbar}>
        <input
          style={s.search}
          placeholder="Buscar gimnasio por nombre o slug..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button key={f} style={s.tab(filter === f)} onClick={() => setFilter(f)}>
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-3)' }}>
          Cargando todos los gimnasios...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <Search size={36} style={{ color: 'var(--color-text-3)', marginBottom: 12 }} />
          <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>No se encontraron gimnasios</p>
        </div>
      ) : (
        <div style={s.grid}>
          {filtered.map((tenant: TenantWithStats) => {
            const plan = PLAN_STYLE[tenant.plan_tier] ?? { color: '#888', label: tenant.plan_tier }
            return (
              <div key={tenant.id} style={{
                ...s.card,
                opacity: tenant.is_active ? 1 : 0.6,
                borderColor: tenant.is_active ? 'var(--color-border)' : 'var(--color-border)',
              }}>
                <div style={s.cardHead}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={s.tenName}>{tenant.name}</span>
                      <span style={s.planBadge(tenant.plan_tier)}>{plan.label}</span>
                    </div>
                    <div style={s.slug}>/{tenant.slug}</div>
                  </div>
                  <span style={s.statusDot(tenant.is_active)}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: tenant.is_active ? 'var(--color-success)' : 'var(--color-text-3)',
                    }} />
                    {tenant.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                  Creado: {new Date(tenant.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>

                <div style={s.metaRow}>
                  <div style={s.metaCell}>
                    <div style={s.metaNum}>{tenant.users ?? '—'}</div>
                    <div style={s.metaLbl}>Usuarios</div>
                  </div>
                  <div style={s.metaCell}>
                    <div style={s.metaNum}>{tenant.athletes ?? '—'}</div>
                    <div style={s.metaLbl}>Atletas</div>
                  </div>
                  <div style={s.metaCell}>
                    <div style={s.metaNum}>{tenant.sessions ?? '—'}</div>
                    <div style={s.metaLbl}>Sesiones</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
