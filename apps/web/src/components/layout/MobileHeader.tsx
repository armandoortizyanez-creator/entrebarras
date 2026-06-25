'use client'

import { Menu, Sun, Moon } from 'lucide-react'
import { useSidebar } from './SidebarContext'
import { useTheme } from '@/hooks/useTheme'

export function MobileHeader() {
  const { toggle } = useSidebar()
  const { theme, toggle: toggleTheme } = useTheme()

  const isLight = theme === 'light'
  const sideBg     = isLight ? '#FFFFFF' : '#080B10'
  const sideBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'
  const sideText   = isLight ? 'rgba(15,17,23,0.50)' : 'rgba(255,255,255,0.45)'
  const sideBgHover = isLight ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.05)'

  return (
    <header
      className="eb-mobile-header"
      style={{ background: sideBg, borderBottom: `1px solid ${sideBorder}` }}
    >
      <button
        onClick={toggle}
        className="eb-mobile-hamburger"
        aria-label="Abrir menú"
        style={{ color: sideText }}
      >
        <Menu size={20} strokeWidth={2} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={isLight ? '/logos/logo-light-v2.png' : '/logos/logo-dark-v2.png'}
        alt="THRYRA"
        style={{ height: 30, width: 'auto' }}
      />
      <button
        onClick={toggleTheme}
        aria-label={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        style={{
          width: 36, height: 36, borderRadius: 9,
          background: sideBgHover,
          border: `1px solid ${sideBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: sideText, flexShrink: 0,
        }}
      >
        {isLight
          ? <Moon size={16} strokeWidth={2} />
          : <Sun size={16} strokeWidth={2} />
        }
      </button>
    </header>
  )
}
