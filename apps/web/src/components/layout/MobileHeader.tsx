'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from './SidebarContext'

export function MobileHeader() {
  const { toggle } = useSidebar()
  return (
    <header className="eb-mobile-header">
      <button
        onClick={toggle}
        className="eb-mobile-hamburger"
        aria-label="Abrir menú"
      >
        <Menu size={20} strokeWidth={2} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: 'var(--color-red)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em' }}>EB</span>
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
          Entre Barras
        </span>
      </div>
      <div style={{ width: 36 }} />
    </header>
  )
}
