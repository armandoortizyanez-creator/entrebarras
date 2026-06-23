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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logos/logo-main.png"
        alt="THRYRA"
        style={{ height: 22, width: 'auto' }}
      />
      <div style={{ width: 36 }} />
    </header>
  )
}
