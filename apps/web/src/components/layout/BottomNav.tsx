'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Zap, Timer, MoreHorizontal, ClipboardList } from 'lucide-react'
import { useSidebar } from './SidebarContext'
import { useUser } from '@/hooks/useUser'

const HOME = { href: '/dashboard', label: 'Home', icon: LayoutDashboard }
const FIJOS = [
  { href: '/dashboard/wods',  label: 'WODs',  icon: Zap },
  { href: '/dashboard/timer', label: 'Timer', icon: Timer },
]

/**
 * El segundo lugar de la barra cambia según quién entra.
 *
 * Un atleta no administra a nadie, así que "Atletas" no le sirve de nada: lo
 * que necesita a mano es su programación. Es el mismo criterio del menú
 * lateral, que ya distinguía los dos roles; la barra inferior se había
 * quedado con la lista fija del coach para todos.
 */
const SEGUNDO_COACH  = { href: '/dashboard/atletas',      label: 'Atletas',      icon: Users }
const SEGUNDO_ATLETA = { href: '/dashboard/programacion', label: 'Programación', icon: ClipboardList }

export function BottomNav() {
  const pathname = usePathname()
  const { open } = useSidebar()
  const { isAthlete } = useUser()

  const items = [HOME, isAthlete ? SEGUNDO_ATLETA : SEGUNDO_COACH, ...FIJOS]

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <nav className="eb-bottom-nav">
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(href)
        return (
          <Link key={href} href={href} className={`eb-bottom-nav-item${active ? ' active' : ''}`}>
            <Icon size={20} strokeWidth={active ? 2.2 : 1.75} />
            <span>{label}</span>
          </Link>
        )
      })}
      <button className="eb-bottom-nav-item" onClick={open}>
        <MoreHorizontal size={20} strokeWidth={1.75} />
        <span>Más</span>
      </button>
    </nav>
  )
}
