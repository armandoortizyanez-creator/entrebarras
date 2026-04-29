import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Entrebarras',
  description: 'Gestión de rutinas para entrenadores CrossFit',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full bg-[#0A0A0A] text-white antialiased">{children}</body>
    </html>
  )
}
