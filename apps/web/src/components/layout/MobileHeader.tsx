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
          <span style={{
            fontSize: 12, fontWeight: 800, color: '#fff',
            fontFamily: 'var(--font-montserrat, Montserrat, system-ui, sans-serif)',
          }}>T</span>
        </div>
        <span style={{
          fontWeight: 800, fontSize: 15, color: '#fff',
          letterSpacing: '0.04em',
          fontFamily: 'var(--font-montserrat, Montserrat, system-ui, sans-serif)',
        }}>
          THRYRA
        </span>
      </div>
      <div style={{ width: 36 }} />
    </header>
  )
}
