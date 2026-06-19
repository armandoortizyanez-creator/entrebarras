import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft: 'var(--sidebar-width)',
        minHeight: '100vh',
        overflowX: 'hidden',
      }}>
        {children}
      </main>
    </div>
  )
}
