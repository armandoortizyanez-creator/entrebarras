'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Dumbbell, Zap,
  BookOpen, CalendarDays, BarChart2, Settings,
  UserCog, Mail, UsersRound, Building2, Shield, X, Percent, ClipboardList, Timer, LogOut,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { ROLE_LABELS } from '@entrebarras/types'
import { useSidebar } from './SidebarContext'
import { createClient } from '@/lib/supabase/client'

type NavItem = { href: string; label: string; icon: React.ElementType }

const BASE_ITEMS: NavItem[] = [
  { href: '/dashboard',               label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/dashboard/atletas',       label: 'Atletas',      icon: Users },
  { href: '/dashboard/rutinas',       label: 'Rutinas',      icon: Dumbbell },
  { href: '/dashboard/wods',          label: 'WODs',         icon: Zap },
  { href: '/dashboard/timer',         label: 'Timer',        icon: Timer },
  { href: '/dashboard/calculadora',   label: 'Calculadora',  icon: Percent },
  { href: '/dashboard/ejercicios',    label: 'Ejercicios',   icon: BookOpen },
  { href: '/dashboard/programacion',  label: 'Programación', icon: ClipboardList },
  { href: '/dashboard/calendario',    label: 'Calendario',   icon: CalendarDays },
  { href: '/dashboard/reportes',      label: 'Reportes',     icon: BarChart2 },
]

const ATHLETE_ITEMS: NavItem[] = [
  { href: '/dashboard',              label: 'Mi Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/wods',         label: 'WODs',         icon: Zap },
  { href: '/dashboard/timer',        label: 'Timer',        icon: Timer },
  { href: '/dashboard/calculadora',  label: 'Mis PRs',      icon: Percent },
  { href: '/dashboard/programacion', label: 'Programación', icon: ClipboardList },
  { href: '/dashboard/calendario',   label: 'Calendario',   icon: CalendarDays },
]

const COACH_ITEMS: NavItem[] = [
  { href: '/dashboard/grupos',       label: 'Grupos',      icon: UsersRound },
  { href: '/dashboard/invitaciones', label: 'Invitaciones', icon: Mail },
]

const SUPER_ADMIN_ITEMS: NavItem[] = [
  { href: '/dashboard/equipo',       label: 'Mi Equipo',   icon: UserCog },
  { href: '/dashboard/grupos',       label: 'Grupos',      icon: UsersRound },
  { href: '/dashboard/invitaciones', label: 'Invitaciones', icon: Mail },
]

const PLATFORM_ADMIN_ITEMS: NavItem[] = [
  { href: '/dashboard/plataforma',   label: 'Plataforma',  icon: Building2 },
  { href: '/dashboard/equipo',       label: 'Equipo',      icon: UserCog },
  { href: '/dashboard/grupos',       label: 'Grupos',      icon: UsersRound },
  { href: '/dashboard/invitaciones', label: 'Invitaciones', icon: Mail },
]

const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
  platform_admin: { bg: 'rgba(99,102,241,0.18)', color: '#818CF8' },
  super_admin:    { bg: 'rgba(34,197,94,0.15)',  color: '#22C55E' },
  coach:          { bg: 'rgba(198,255,0,0.15)',  color: '#C6FF00' },
  athlete:        { bg: 'rgba(99,102,241,0.12)', color: '#6366F1' },
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { role, isPlatformAdmin, isSuperAdmin, isCoach, isAthlete } = useUser()
  const { isOpen, close } = useSidebar()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const extraItems = isPlatformAdmin
    ? PLATFORM_ADMIN_ITEMS
    : isSuperAdmin
    ? SUPER_ADMIN_ITEMS
    : isCoach
    ? COACH_ITEMS
    : []

  const navItems = isAthlete ? ATHLETE_ITEMS : [...BASE_ITEMS, ...extraItems]

  const badge = role ? ROLE_BADGE[role] : undefined
  const roleLabel = role ? ROLE_LABELS[role] : undefined

  const handleNavClick = () => close()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="eb-sidebar-overlay"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside className={`eb-sidebar${isOpen ? ' is-open' : ''}`}>
        {/* Logo + mobile close */}
        <div style={{ padding: '18px 16px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Link href="/dashboard" onClick={handleNavClick} style={{ display: 'flex', flexDirection: 'column', gap: 6, textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/logo-main.png"
              alt="THRYRA"
              style={{ height: 20, width: 'auto' }}
            />
            {roleLabel && badge && (
              <span style={{
                display: 'inline-block',
                fontSize: 9.5, fontWeight: 600, lineHeight: 1,
                color: badge.color, background: badge.bg,
                borderRadius: 4, padding: '2px 5px',
              }}>
                {roleLabel}
              </span>
            )}
          </Link>
          {/* Close button — only visible on mobile */}
          <button
            className="eb-sidebar-close"
            onClick={close}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--sidebar-border)', margin: '0 16px 10px' }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '7.5px 10px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 13.5, fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                  background: isActive ? 'var(--sidebar-bg-active)' : 'transparent',
                  transition: 'background 0.12s, color 0.12s',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-bg-hover)'
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                {isActive && (
                  <span style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 18, borderRadius: '0 2px 2px 0',
                    background: 'var(--color-red)',
                  }} />
                )}
                <Icon
                  size={15.5}
                  strokeWidth={isActive ? 2 : 1.75}
                  style={{ flexShrink: 0, opacity: isActive ? 1 : 0.55 }}
                />
                {item.label}
              </Link>
            )
          })}

          {isPlatformAdmin && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 10px 4px',
              marginTop: 4,
            }}>
              <Shield size={11} style={{ color: '#818CF8', opacity: 0.7 }} />
              <span style={{ fontSize: 10, color: '#818CF8', opacity: 0.7, fontWeight: 600, letterSpacing: '0.08em' }}>
                PLATAFORMA
              </span>
            </div>
          )}
        </nav>

        {/* Bottom: Configuración + Cerrar sesión */}
        <div style={{ padding: '10px', borderTop: '1px solid var(--sidebar-border)', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Link
            href="/dashboard/configuracion"
            onClick={handleNavClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '7.5px 10px', borderRadius: 8,
              textDecoration: 'none', fontSize: 13.5,
              color: pathname.startsWith('/dashboard/configuracion')
                ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
              background: pathname.startsWith('/dashboard/configuracion')
                ? 'var(--sidebar-bg-active)' : 'transparent',
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={e => {
              if (!pathname.startsWith('/dashboard/configuracion'))
                (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-bg-hover)'
            }}
            onMouseLeave={e => {
              if (!pathname.startsWith('/dashboard/configuracion'))
                (e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
          >
            <Settings size={15.5} strokeWidth={1.75} style={{ opacity: 0.55 }} />
            Configuración
          </Link>
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '7.5px 10px', borderRadius: 8,
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 13.5, color: 'rgba(239,68,68,0.65)',
              width: '100%', textAlign: 'left',
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.10)'
              ;(e.currentTarget as HTMLElement).style.color = '#EF4444'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.65)'
            }}
          >
            <LogOut size={15.5} strokeWidth={1.75} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
