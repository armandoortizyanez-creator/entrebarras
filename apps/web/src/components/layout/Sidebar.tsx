'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Dumbbell, Zap,
  BookOpen, CalendarDays, BarChart2, Settings,
  UserCog, Mail, UsersRound, Building2, Shield, X, Percent, ClipboardList,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { ROLE_LABELS } from '@entrebarras/types'
import { useSidebar } from './SidebarContext'

type NavItem = { href: string; label: string; icon: React.ElementType }

const BASE_ITEMS: NavItem[] = [
  { href: '/dashboard',               label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/dashboard/atletas',       label: 'Atletas',      icon: Users },
  { href: '/dashboard/rutinas',       label: 'Rutinas',      icon: Dumbbell },
  { href: '/dashboard/wods',          label: 'WODs',         icon: Zap },
  { href: '/dashboard/calculadora',   label: 'Calculadora',  icon: Percent },
  { href: '/dashboard/ejercicios',    label: 'Ejercicios',   icon: BookOpen },
  { href: '/dashboard/programacion',  label: 'Programación', icon: ClipboardList },
  { href: '/dashboard/calendario',    label: 'Calendario',   icon: CalendarDays },
  { href: '/dashboard/reportes',      label: 'Reportes',     icon: BarChart2 },
]

const ATHLETE_ITEMS: NavItem[] = [
  { href: '/dashboard',              label: 'Mi Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/wods',         label: 'WODs',         icon: Zap },
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
  platform_admin: { bg: 'rgba(108,99,255,0.15)', color: '#6c63ff' },
  super_admin:    { bg: 'rgba(76,175,80,0.15)',  color: '#4caf50' },
  coach:          { bg: 'rgba(233,30,140,0.15)', color: '#e91e8c' },
  athlete:        { bg: 'rgba(33,150,243,0.15)', color: '#2196f3' },
}

export function Sidebar() {
  const pathname = usePathname()
  const { role, isPlatformAdmin, isSuperAdmin, isCoach, isAthlete } = useUser()
  const { isOpen, close } = useSidebar()

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
          <Link href="/dashboard" onClick={handleNavClick} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--color-red)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: '0 2px 8px rgba(229,57,53,0.4)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em' }}>EB</span>
            </div>
            <div>
              <span style={{
                display: 'block',
                fontWeight: 700, fontSize: 14.5, color: '#fff',
                letterSpacing: '-0.02em', lineHeight: 1.15,
              }}>
                Entre Barras
              </span>
              {roleLabel && badge ? (
                <span style={{
                  display: 'inline-block', marginTop: 2,
                  fontSize: 9.5, fontWeight: 600, lineHeight: 1,
                  color: badge.color, background: badge.bg,
                  borderRadius: 4, padding: '2px 5px',
                }}>
                  {roleLabel}
                </span>
              ) : (
                <span style={{ display: 'block', fontSize: 10.5, color: 'var(--sidebar-label)', lineHeight: 1 }}>
                  Coach Platform
                </span>
              )}
            </div>
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
                  style={{ flexShrink: 0, opacity: isActive ? 1 : 0.65 }}
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
              <Shield size={11} style={{ color: '#6c63ff', opacity: 0.7 }} />
              <span style={{ fontSize: 10, color: '#6c63ff', opacity: 0.7, fontWeight: 600, letterSpacing: '0.08em' }}>
                PLATAFORMA
              </span>
            </div>
          )}
        </nav>

        {/* Bottom: Configuración */}
        <div style={{ padding: '10px', borderTop: '1px solid var(--sidebar-border)' }}>
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
            <Settings size={15.5} strokeWidth={1.75} style={{ opacity: 0.65 }} />
            Configuración
          </Link>
        </div>
      </aside>
    </>
  )
}
