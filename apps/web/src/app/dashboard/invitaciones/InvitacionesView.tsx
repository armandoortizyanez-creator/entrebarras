'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInvitations, createInvitation, deleteInvitation,
  type InvitationRow,
} from '@/lib/queries/team'
import { useUser } from '@/hooks/useUser'
import { Mail, Clock, CheckCircle, XCircle, Plus, Trash2, Shield } from 'lucide-react'
import { ROLE_LABELS } from '@entrebarras/types'

type InvStatus = 'all' | 'pending' | 'accepted' | 'expired'

function getInvStatus(inv: InvitationRow): 'pending' | 'accepted' | 'expired' {
  if (inv.accepted_at) return 'accepted'
  if (new Date(inv.expires_at) < new Date()) return 'expired'
  return 'pending'
}

export function InvitacionesView() {
  const { canInvite, isSuperAdmin, isPlatformAdmin, isCoach, role } = useUser()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<InvStatus>('all')
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [invRole, setInvRole] = useState<'super_admin' | 'coach' | 'athlete'>('coach')
  const [formError, setFormError] = useState('')

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: getInvitations,
  })

  const create = useMutation({
    mutationFn: ({ email, role }: { email: string; role: 'super_admin' | 'coach' | 'athlete' }) =>
      createInvitation(email, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invitations'] })
      setShowForm(false)
      setEmail('')
      setFormError('')
    },
    onError: (err: Error) => setFormError(err.message),
  })

  const remove = useMutation({
    mutationFn: deleteInvitation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations'] }),
  })

  if (!canInvite) {
    return (
      <div style={{ padding: '64px 40px', textAlign: 'center' }}>
        <Shield size={40} style={{ color: 'var(--color-text-3)', marginBottom: 16 }} />
        <p style={{ color: 'var(--color-text-2)', fontSize: 15 }}>No tienes permisos para invitar usuarios.</p>
      </div>
    )
  }

  // Roles that this user can invite
  const availableRoles = isPlatformAdmin || isSuperAdmin
    ? (['super_admin', 'coach', 'athlete'] as const)
    : (['athlete'] as const)

  const filtered = invitations.filter(inv => {
    const st = getInvStatus(inv)
    return filter === 'all' || st === filter
  })

  const counts = {
    all: invitations.length,
    pending: invitations.filter(i => getInvStatus(i) === 'pending').length,
    accepted: invitations.filter(i => getInvStatus(i) === 'accepted').length,
    expired: invitations.filter(i => getInvStatus(i) === 'expired').length,
  }

  const STATUS_STYLE: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending:  { color: '#f59e0b', icon: <Clock size={13} />,         label: 'Pendiente' },
    accepted: { color: '#4caf50', icon: <CheckCircle size={13} />,   label: 'Aceptada' },
    expired:  { color: 'var(--color-text-3)', icon: <XCircle size={13} />, label: 'Expirada' },
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setFormError('El email es requerido'); return }
    setFormError('')
    create.mutate({ email: email.trim().toLowerCase(), role: invRole })
  }

  const s = {
    page:     { padding: '32px 40px', maxWidth: 900 },
    header:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
    title:    { fontSize: 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' },
    sub:      { fontSize: 14, color: 'var(--color-text-3)', marginTop: 4 },
    tabs:     { display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 },
    tab:      (active: boolean) => ({
      padding: '5px 14px', borderRadius: 999, border: 'none',
      fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
      background: active ? 'var(--color-red)' : 'transparent',
      color: active ? '#fff' : 'var(--color-text-3)',
    }),
    card:     { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 16 },
    avatar:   { width: 36, height: 36, borderRadius: '50%', background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    badge:    (color: string) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: `${color}22`, color }),
    formCard: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 24 },
    label:    { fontSize: 13, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 6, display: 'block' },
    input:    { width: '100%', height: 40, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)', padding: '0 12px', fontSize: 14, boxSizing: 'border-box' as const },
    select:   { width: '100%', height: 40, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg)', color: 'var(--color-text)', padding: '0 12px', fontSize: 14 },
    btnPrimary: { background: 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    btnSecondary: { background: 'var(--color-surface)', color: 'var(--color-text-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '9px 16px', fontSize: 14, cursor: 'pointer' },
    row:      { display: 'flex', gap: 12 },
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Invitaciones</h1>
          <p style={s.sub}>
            {isCoach && !isSuperAdmin
              ? 'Invita atletas a tu lista de clientes'
              : 'Gestiona las invitaciones para coaches y atletas de tu gimnasio'}
          </p>
        </div>
        {!showForm && (
          <button style={s.btnPrimary} onClick={() => setShowForm(true)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Plus size={15} /> Nueva invitación
            </span>
          </button>
        )}
      </div>

      {/* Invite form */}
      {showForm && (
        <div style={s.formCard}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18, color: 'var(--color-text)' }}>
            Nueva invitación
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={s.label}>Email *</label>
                <input
                  style={s.input}
                  type="email"
                  placeholder="nombre@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label style={s.label}>Rol</label>
                <select
                  style={s.select}
                  value={invRole}
                  onChange={e => setInvRole(e.target.value as typeof invRole)}
                >
                  {availableRoles.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
            </div>
            {formError && (
              <p style={{ color: 'var(--color-danger, #e53935)', fontSize: 13, marginBottom: 12 }}>{formError}</p>
            )}
            <div style={s.row}>
              <button type="submit" style={s.btnPrimary} disabled={create.isPending}>
                {create.isPending ? 'Enviando...' : 'Enviar invitación'}
              </button>
              <button type="button" style={s.btnSecondary} onClick={() => { setShowForm(false); setFormError('') }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={s.tabs}>
        {(['all', 'pending', 'accepted', 'expired'] as InvStatus[]).map(st => (
          <button key={st} style={s.tab(filter === st)} onClick={() => setFilter(st)}>
            {st === 'all' ? 'Todas' : st === 'pending' ? 'Pendientes' : st === 'accepted' ? 'Aceptadas' : 'Expiradas'}
            <span style={{ marginLeft: 5, opacity: 0.7 }}>({counts[st]})</span>
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-3)' }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <Mail size={36} style={{ color: 'var(--color-text-3)', marginBottom: 12 }} />
          <p style={{ color: 'var(--color-text-3)', fontSize: 14 }}>
            {filter === 'all' ? 'Aún no has enviado invitaciones' : 'No hay invitaciones en este estado'}
          </p>
        </div>
      ) : (
        filtered.map(inv => {
          const st = getInvStatus(inv)
          const stStyle = STATUS_STYLE[st]
          const daysLeft = Math.max(0, Math.ceil((new Date(inv.expires_at).getTime() - Date.now()) / 86400000))

          return (
            <div key={inv.id} style={s.card}>
              <div style={{ ...s.avatar, background: `${stStyle.color}22` }}>
                <Mail size={16} style={{ color: stStyle.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                  <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--color-text)' }}>{inv.email}</span>
                  <span style={s.badge(ROLE_COLORS_MAP[inv.role] ?? '#888')}>
                    {ROLE_LABELS[inv.role as keyof typeof ROLE_LABELS] ?? inv.role}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: stStyle.color }}>
                    {stStyle.icon} {stStyle.label}
                  </span>
                  {st === 'pending' && (
                    <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                      Expira en {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                    </span>
                  )}
                  {inv.inviter_name && (
                    <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                      Invitado por {inv.inviter_name}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>
                    {new Date(inv.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>
              {st !== 'accepted' && (
                <button
                  onClick={() => remove.mutate(inv.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)', padding: 4 }}
                  title="Eliminar invitación"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

const ROLE_COLORS_MAP: Record<string, string> = {
  platform_admin: '#6c63ff',
  super_admin: '#4caf50',
  coach: '#e91e8c',
  athlete: '#2196f3',
}
