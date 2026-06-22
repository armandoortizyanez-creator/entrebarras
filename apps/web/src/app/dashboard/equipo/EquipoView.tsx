'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCoachTeam, deactivateTeamMember, reactivateTeamMember,
  type TeamMember,
} from '@/lib/queries/team'
import { useUser } from '@/hooks/useUser'
import { UserCog, Users, Shield, MoreHorizontal, UserCheck, UserX, Mail } from 'lucide-react'
import { ROLE_LABELS, ROLE_COLORS } from '@entrebarras/types'
import Link from 'next/link'

const ROLE_FILTER = ['all', 'super_admin', 'coach'] as const
type RoleFilter = typeof ROLE_FILTER[number]

export function EquipoView() {
  const { canManageUsers } = useUser()
  const qc = useQueryClient()
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: getCoachTeam,
  })

  const deactivate = useMutation({
    mutationFn: deactivateTeamMember,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  })
  const reactivate = useMutation({
    mutationFn: reactivateTeamMember,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  })

  if (!canManageUsers) {
    return (
      <div style={{ padding: '64px 40px', textAlign: 'center' }}>
        <Shield size={40} style={{ color: 'var(--color-text-3)', marginBottom: 16 }} />
        <p style={{ color: 'var(--color-text-2)', fontSize: 15 }}>
          No tienes permisos para ver esta sección.
        </p>
      </div>
    )
  }

  const filtered = members.filter(m => {
    const matchRole = roleFilter === 'all' || m.role === roleFilter
    const matchSearch = search === '' ||
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  const coaches = members.filter(m => m.role === 'coach')
  const admins = members.filter(m => m.role === 'super_admin')
  const totalAthletes = members.reduce((s, m) => s + (m.athlete_count ?? 0), 0)

  const s = {
    page:      { padding: '32px 40px', maxWidth: 1200 },
    header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
    title:     { fontSize: 22, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em' },
    sub:       { fontSize: 14, color: 'var(--color-text-3)', marginTop: 4 },
    statsRow:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 },
    statCard:  { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' },
    statNum:   { fontSize: 28, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.03em' },
    statLabel: { fontSize: 12, color: 'var(--color-text-3)', marginTop: 4 },
    toolbar:   { display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' },
    input:     { flex: 1, height: 38, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', color: 'var(--color-text)', padding: '0 12px', fontSize: 13.5 },
    tabRow:    { display: 'flex', gap: 6 },
    tab:       (active: boolean) => ({
      padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: 'none',
      fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
      background: active ? 'var(--color-red)' : 'var(--color-surface)',
      color: active ? '#fff' : 'var(--color-text-2)',
    }),
    table:    { width: '100%', borderCollapse: 'collapse' as const },
    th:       { textAlign: 'left' as const, padding: '10px 14px', fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-3)', borderBottom: '1px solid var(--color-border)', letterSpacing: '0.05em' },
    td:       { padding: '14px 14px', fontSize: 13.5, color: 'var(--color-text)', borderBottom: '1px solid var(--color-border-subtle, #2a2a2a)' },
    avatar:   { width: 32, height: 32, borderRadius: '50%', background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--color-text-2)', flexShrink: 0 },
    badge:    (role: string) => ({
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      fontSize: 11, fontWeight: 600,
      background: `${ROLE_COLORS[role as keyof typeof ROLE_COLORS]}22`,
      color: ROLE_COLORS[role as keyof typeof ROLE_COLORS] ?? 'var(--color-text-3)',
    }),
    menu:     { position: 'absolute' as const, right: 0, top: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, minWidth: 160, zIndex: 50, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', overflow: 'hidden' },
    menuItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 13, cursor: 'pointer', color: 'var(--color-text)', background: 'none', border: 'none', width: '100%', textAlign: 'left' as const },
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Mi Equipo</h1>
          <p style={s.sub}>Gestiona los coaches y administradores de tu gimnasio</p>
        </div>
        <Link
          href="/dashboard/invitaciones"
          style={{
            background: 'var(--color-red)', color: '#fff', borderRadius: 'var(--radius-md)',
            padding: '9px 18px', fontSize: 14, fontWeight: 600, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 7,
          }}
        >
          <Mail size={15} />
          Invitar miembro
        </Link>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <UserCog size={18} style={{ color: '#4caf50' }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 600 }}>ADMINS</span>
          </div>
          <div style={s.statNum}>{admins.length}</div>
          <div style={s.statLabel}>Administradores del gym</div>
        </div>
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Shield size={18} style={{ color: '#e91e8c' }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 600 }}>COACHES</span>
          </div>
          <div style={s.statNum}>{coaches.length}</div>
          <div style={s.statLabel}>Coaches activos</div>
        </div>
        <div style={s.statCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Users size={18} style={{ color: '#2196f3' }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-3)', fontWeight: 600 }}>ATLETAS</span>
          </div>
          <div style={s.statNum}>{totalAthletes}</div>
          <div style={s.statLabel}>Asignados a coaches</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={s.toolbar}>
        <input
          style={s.input}
          placeholder="Buscar por nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={s.tabRow}>
          {(['all', 'super_admin', 'coach'] as RoleFilter[]).map(r => (
            <button key={r} style={s.tab(roleFilter === r)} onClick={() => setRoleFilter(r)}>
              {r === 'all' ? 'Todos' : ROLE_LABELS[r as keyof typeof ROLE_LABELS]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-3)' }}>
          Cargando equipo...
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>MIEMBRO</th>
                <th style={s.th}>ROL</th>
                <th style={s.th}>ATLETAS</th>
                <th style={s.th}>ESTADO</th>
                <th style={s.th}>INGRESÓ</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...s.td, textAlign: 'center', padding: '40px', color: 'var(--color-text-3)' }}>
                    No se encontraron miembros
                  </td>
                </tr>
              ) : filtered.map(member => (
                <tr key={member.id}>
                  <td style={s.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={s.avatar}>
                        {member.avatar_url
                          ? <img src={member.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          : `${member.first_name[0]}${member.last_name[0]}`}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{member.first_name} {member.last_name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={s.td}>
                    <span style={s.badge(member.role)}>
                      {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] ?? member.role}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ color: member.athlete_count ? 'var(--color-text)' : 'var(--color-text-3)' }}>
                      {member.athlete_count ?? 0}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 12, fontWeight: 500,
                      color: member.is_active ? 'var(--color-success)' : 'var(--color-text-3)',
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: member.is_active ? 'var(--color-success)' : 'var(--color-text-3)',
                      }} />
                      {member.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ ...s.td, color: 'var(--color-text-3)', fontSize: 12.5 }}>
                    {new Date(member.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ ...s.td, position: 'relative' }}>
                    <button
                      onClick={() => setMenuOpen(menuOpen === member.id ? null : member.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)', padding: '4px' }}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {menuOpen === member.id && (
                      <div style={s.menu}>
                        {member.is_active ? (
                          <button
                            style={{ ...s.menuItem, color: 'var(--color-danger, #e53935)' }}
                            onClick={() => { deactivate.mutate(member.id); setMenuOpen(null) }}
                          >
                            <UserX size={14} /> Desactivar
                          </button>
                        ) : (
                          <button
                            style={s.menuItem}
                            onClick={() => { reactivate.mutate(member.id); setMenuOpen(null) }}
                          >
                            <UserCheck size={14} /> Reactivar
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
