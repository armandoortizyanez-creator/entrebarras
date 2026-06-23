'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Zap, Timer, MoreHorizontal } from 'lucide-react'
import { useSidebar } from './SidebarContext'

const BOTTOM_ITEMS = [
  { href: '/dashboard',         label: 'Home',    icon: LayoutDashboard },
  { href: '/dashboard/atletas', label: 'Atletas', icon: Users },
  { href: '/dashboard/wods',    label: 'WODs',    icon: Zap },
  { href: '/dashboard/timer',   label: 'Timer',   icon: Timer },
]

export function BottomNav() {
  const pathname = usePathname()
  const { open } = useSidebar()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <nav className="eb-bottom-nav">
      {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => {
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
