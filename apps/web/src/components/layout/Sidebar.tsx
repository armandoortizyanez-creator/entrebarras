'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '◻' },
  { href: '/dashboard/atletas', label: 'Atletas', icon: '◻' },
  { href: '/dashboard/rutinas', label: 'Rutinas', icon: '◻' },
  { href: '/dashboard/wods', label: 'WODs', icon: '◻' },
  { href: '/dashboard/ejercicios', label: 'Ejercicios', icon: '◻' },
  { href: '/dashboard/calendario', label: 'Calendario', icon: '◻' },
  { href: '/dashboard/reportes', label: 'Reportes', icon: '◻' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-red)', letterSpacing: '-0.02em' }}>
          Entre Barras
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                fontSize: 14, fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--color-text)' : 'var(--color-text-3)',
                background: isActive ? 'var(--color-surface-2)' : 'transparent',
                transition: 'background 0.1s, color 0.1s',
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isActive ? 'var(--color-red)' : 'var(--color-border)',
                flexShrink: 0,
              }} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User / logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--color-border)' }}>
        <Link href="/dashboard/configuracion" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 'var(--radius-md)',
          textDecoration: 'none', fontSize: 14, color: 'var(--color-text-3)',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-border)', flexShrink: 0 }} />
          Configuración
        </Link>
      </div>
    </aside>
  )
}
