'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Dumbbell, Zap,
  BookOpen, CalendarDays, BarChart2, Settings,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',             label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/dashboard/atletas',     label: 'Atletas',     icon: Users },
  { href: '/dashboard/rutinas',     label: 'Rutinas',     icon: Dumbbell },
  { href: '/dashboard/wods',        label: 'WODs',        icon: Zap },
  { href: '/dashboard/ejercicios',  label: 'Ejercicios',  icon: BookOpen },
  { href: '/dashboard/calendario',  label: 'Calendario',  icon: CalendarDays },
  { href: '/dashboard/reportes',    label: 'Reportes',    icon: BarChart2 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'var(--sidebar-bg)',
      display: 'flex', flexDirection: 'column',
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 16px' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
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
            <span style={{ display: 'block', fontSize: 10.5, color: 'var(--sidebar-label)', lineHeight: 1 }}>
              Coach Platform
            </span>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--sidebar-border)', margin: '0 16px 10px' }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
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
              {/* Active accent */}
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
      </nav>

      {/* Bottom */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--sidebar-border)' }}>
        <Link
          href="/dashboard/configuracion"
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
  )
}
