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
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/thryra-icon-lime-dark.png"
          alt="THRYRA"
          style={{ width: 30, height: 30, mixBlendMode: 'screen' }}
        />
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
