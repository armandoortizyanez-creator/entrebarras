'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTenantProfile, updateTenantProfile,
  getMyProfile, updateMyProfile, updatePassword,
  getCoaches, getSubscription,
} from '@/lib/queries/config'

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  trial:   { label: 'Prueba gratuita', color: 'var(--color-info)' },
  starter: { label: 'Starter',         color: 'var(--color-success)' },
  growth:  { label: 'Growth',          color: 'var(--color-warning)' },
  pro:     { label: 'Pro',             color: 'var(--color-red)' },
}

const SUB_STATUS: Record<string, string> = {
  trialing:  'En período de prueba',
  active:    'Activa',
  past_due:  'Pago pendiente',
  canceled:  'Cancelada',
}

export function ConfiguracionView() {
  const [activeTab, setActiveTab] = useState<'org' | 'perfil' | 'equipo' | 'plan'>('org')

  const tabs = [
    { id: 'org' as const,    label: 'Organización' },
    { id: 'perfil' as const, label: 'Mi perfil' },
    { id: 'equipo' as const, label: 'Equipo' },
    { id: 'plan' as const,   label: 'Plan y facturación' },
  ]

  return (
    <div className="eb-page" style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', marginBottom: 28 }}>
        Configuración
      </h1>

      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--color-border)', paddingBottom: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' } as React.CSSProperties}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: activeTab === t.id ? 600 : 400,
              color: activeTab === t.id ? 'var(--color-text)' : 'var(--color-text-3)',
              borderBottom: `2px solid ${activeTab === t.id ? 'var(--color-red)' : 'transparent'}`,
              marginBottom: -1, whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'org'    && <OrgTab />}
      {activeTab === 'perfil' && <PerfilTab />}
      {activeTab === 'equipo' && <EquipoTab />}
      {activeTab === 'plan'   && <PlanTab />}
    </div>
  )
}

function OrgTab() {
  const qc = useQueryClient()
  const { data: tenant, isLoading } = useQuery({ queryKey: ['tenant'], queryFn: getTenantProfile })
  const [form, setForm] = useState({ name: '', logo_url: '' })
  const [saved, setSaved] = useState(false)

  const mutation = useMutation({
    mutationFn: () => updateTenantProfile({ name: form.name || tenant?.name, logo_url: form.logo_url || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  if (isLoading) return <SectionSkeleton />

  const currentName = form.name || tenant?.name || ''
  const plan = tenant?.plan_tier ? PLAN_LABELS[tenant.plan_tier] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card title="Información de la organización">
        <FormField
          label="Nombre de la organización"
          value={currentName}
          onChange={v => setForm(p => ({ ...p, name: v }))}
        />
        <FormField
          label="URL del logo (opcional)"
          value={form.logo_url}
          onChange={v => setForm(p => ({ ...p, logo_url: v }))}
          placeholder="https://..."
        />
        <div style={{ marginTop: 4 }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 6 }}>
            Slug público: <code style={{ background: 'var(--color-surface-2)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{tenant?.slug}</code>
          </p>
        </div>
        <SaveButton onClick={() => mutation.mutate()} loading={mutation.isPending} saved={saved} />
      </Card>

      {plan && (
        <Card title="Plan actual">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: plan.color }}>{plan.label}</span>
          </div>
        </Card>
      )}
    </div>
  )
}

function PerfilTab() {
  const qc = useQueryClient()
  const { data: profile, isLoading } = useQuery({ queryKey: ['my-profile'], queryFn: getMyProfile })
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '' })
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' })
  const [saved, setSaved] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  const profileMutation = useMutation({
    mutationFn: () => updateMyProfile({
      first_name: form.first_name || profile?.first_name,
      last_name: form.last_name || profile?.last_name,
      phone: form.phone || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError(null)
    if (pwForm.password.length < 8) return setPwError('La contraseña debe tener al menos 8 caracteres')
    if (pwForm.password !== pwForm.confirm) return setPwError('Las contraseñas no coinciden')
    await updatePassword(pwForm.password)
    setPwForm({ password: '', confirm: '' })
    setPwSaved(true)
    setTimeout(() => setPwSaved(false), 2000)
  }

  if (isLoading) return <SectionSkeleton />

  const roleLabels: Record<string, string> = { owner: 'Propietario', coach: 'Coach', athlete: 'Atleta' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card title="Datos personales">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: 'var(--color-red)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: '#fff',
          }}>
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{profile?.first_name} {profile?.last_name}</p>
            <span style={{ fontSize: 12, color: 'var(--color-text-3)', background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
              {roleLabels[profile?.role ?? ''] ?? profile?.role}
            </span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Nombre" value={form.first_name || profile?.first_name || ''} onChange={v => setForm(p => ({ ...p, first_name: v }))} />
          <FormField label="Apellido" value={form.last_name || profile?.last_name || ''} onChange={v => setForm(p => ({ ...p, last_name: v }))} />
        </div>
        <FormField label="Teléfono" value={form.phone || profile?.phone || ''} onChange={v => setForm(p => ({ ...p, phone: v }))} />
        <SaveButton onClick={() => profileMutation.mutate()} loading={profileMutation.isPending} saved={saved} />
      </Card>

      <Card title="Cambiar contraseña">
        <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Nueva contraseña" type="password" value={pwForm.password} onChange={v => setPwForm(p => ({ ...p, password: v }))} />
          <FormField label="Confirmar contraseña" type="password" value={pwForm.confirm} onChange={v => setPwForm(p => ({ ...p, confirm: v }))} />
          {pwError && <p style={{ fontSize: 13, color: 'var(--color-error)', background: 'var(--color-error-bg)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>{pwError}</p>}
          <SaveButton type="submit" label={pwSaved ? 'Contraseña actualizada' : 'Actualizar contraseña'} saved={pwSaved} />
        </form>
      </Card>
    </div>
  )
}

function EquipoTab() {
  const { data: coaches = [], isLoading } = useQuery({ queryKey: ['coaches'], queryFn: getCoaches })

  const roleLabels: Record<string, { label: string; color: string }> = {
    owner: { label: 'Propietario', color: 'var(--color-red)' },
    coach: { label: 'Coach', color: 'var(--color-info)' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card title={`Equipo (${coaches.length})`}>
        {isLoading ? <SectionSkeleton /> : (
          <div>
            {coaches.map((c, i) => {
              const r = roleLabels[c.role]
              return (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 0',
                  borderBottom: i < coaches.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', background: 'var(--color-surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 600, color: 'var(--color-text-2)', flexShrink: 0,
                  }}>
                    {c.first_name?.[0]}{c.last_name?.[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>{c.first_name} {c.last_name}</p>
                    {c.phone && <p style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{c.phone}</p>}
                  </div>
                  {r && (
                    <span style={{ fontSize: 12, fontWeight: 500, color: r.color, background: r.color + '18', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
                      {r.label}
                    </span>
                  )}
                </div>
              )
            })}

            {coaches.length === 0 && (
              <p style={{ fontSize: 14, color: 'var(--color-text-3)', textAlign: 'center', padding: '20px 0' }}>
                Sin coaches registrados.
              </p>
            )}
          </div>
        )}
      </Card>

      <Card title="Invitar coach">
        <p style={{ fontSize: 14, color: 'var(--color-text-3)', marginBottom: 16 }}>
          Los coaches recibirán un correo con instrucciones para crear su cuenta y unirse a tu organización.
        </p>
        <InviteCoachForm />
      </Card>
    </div>
  )
}

function InviteCoachForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    // Placeholder: implementar con Supabase Auth invite
    await new Promise(r => setTimeout(r, 800))
    setSent(true)
    setEmail('')
    setLoading(false)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <form onSubmit={handleInvite} style={{ display: 'flex', gap: 10 }}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="coach@ejemplo.com"
        required
        style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', outline: 'none' }}
      />
      <button type="submit" disabled={loading} style={{ padding: '9px 18px', background: sent ? 'var(--color-success)' : 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
        {sent ? 'Enviado' : loading ? 'Enviando...' : 'Invitar'}
      </button>
    </form>
  )
}

function PlanTab() {
  const { data: subscription, isLoading } = useQuery({ queryKey: ['subscription'], queryFn: getSubscription })

  const plan = subscription?.plan_tier ? PLAN_LABELS[subscription.plan_tier] : PLAN_LABELS['trial']
  const status = subscription?.status ? SUB_STATUS[subscription.status] : 'Sin datos'

  const trialEnd = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const daysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  const PLANS = [
    { tier: 'starter', name: 'Starter', price: '$19.990', athletes: 'Hasta 20 atletas', coaches: '1 coach' },
    { tier: 'growth',  name: 'Growth',  price: '$39.990', athletes: 'Hasta 60 atletas', coaches: '3 coaches' },
    { tier: 'pro',     name: 'Pro',     price: '$79.990', athletes: 'Atletas ilimitados', coaches: 'Coaches ilimitados' },
  ]

  if (isLoading) return <SectionSkeleton />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card title="Estado actual">
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Stat label="Plan" value={<span style={{ color: plan?.color }}>{plan?.label}</span>} />
          <Stat label="Estado" value={status} />
          {trialEnd && <Stat label="Fin de prueba" value={trialEnd} />}
          {daysLeft !== null && (
            <Stat
              label="Días restantes"
              value={<span style={{ color: daysLeft <= 5 ? 'var(--color-error)' : 'var(--color-text)' }}>{daysLeft}</span>}
            />
          )}
        </div>
      </Card>

      <Card title="Planes disponibles">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {PLANS.map(p => {
            const isCurrent = subscription?.plan_tier === p.tier
            return (
              <div key={p.tier} style={{
                border: `1.5px solid ${isCurrent ? 'var(--color-red)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-lg)', padding: '16px',
                background: isCurrent ? 'var(--color-red-muted)' : 'var(--color-surface)',
              }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: isCurrent ? 'var(--color-red)' : 'var(--color-text)', marginBottom: 4 }}>{p.name}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)', marginBottom: 12, letterSpacing: '-0.02em' }}>{p.price}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-text-3)' }}>/mes</span></p>
                <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 4 }}>{p.athletes}</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-3)', marginBottom: 14 }}>{p.coaches}</p>
                {!isCurrent && (
                  <button style={{ width: '100%', padding: '8px', background: 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Cambiar a {p.name}
                  </button>
                )}
                {isCurrent && (
                  <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--color-red)' }}>Plan actual</p>
                )}
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 14 }}>
          Precios en CLP. Facturación mensual. Cancela cuando quieras.
        </p>
      </Card>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>{title}</h2>
      </div>
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  )
}

function FormField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange?: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 5 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 14, color: 'var(--color-text)', background: 'var(--color-surface)', boxSizing: 'border-box', outline: 'none' }}
      />
    </div>
  )
}

function SaveButton({ onClick, loading = false, saved = false, label = 'Guardar cambios', type = 'button' as 'button' | 'submit' }: {
  onClick?: () => void; loading?: boolean; saved?: boolean; label?: string; type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      style={{
        alignSelf: 'flex-start', padding: '9px 20px',
        background: saved ? 'var(--color-success)' : loading ? 'var(--color-border)' : 'var(--color-red)',
        color: loading ? 'var(--color-text-3)' : '#fff',
        border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
      }}
    >
      {saved ? 'Guardado' : loading ? 'Guardando...' : label}
    </button>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{value}</p>
    </div>
  )
}

function SectionSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[80, 120, 60].map((h, i) => (
        <div key={i} style={{ height: h, background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }} />
      ))}
    </div>
  )
}
