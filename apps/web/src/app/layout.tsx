import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Providers } from './providers'

/**
 * Fuentes alojadas en el proyecto, no descargadas de Google en cada build.
 *
 * `next/font/google` va a buscar los .woff2 a fonts.gstatic.com durante la
 * compilación. Google rota esas URLs con hash, así que una caché vieja termina
 * pidiendo archivos que ya devuelven 404 y el build entero falla. Además obliga
 * a tener internet para levantar el proyecto.
 *
 * Con next/font/local los archivos viven en src/app/fonts: el build es
 * reproducible, funciona sin conexión y no depende de que Google no mueva nada.
 * Son solo los pesos y el subconjunto latino que la app realmente usa.
 */
const inter = localFont({
  variable: '--font-inter',
  display: 'swap',
  src: [
    { path: './fonts/Inter-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Inter-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Inter-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/Inter-700.woff2', weight: '700', style: 'normal' },
  ],
})

const montserrat = localFont({
  variable: '--font-montserrat',
  display: 'swap',
  src: [
    { path: './fonts/Montserrat-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/Montserrat-700.woff2', weight: '700', style: 'normal' },
    { path: './fonts/Montserrat-800.woff2', weight: '800', style: 'normal' },
    { path: './fonts/Montserrat-900.woff2', weight: '900', style: 'normal' },
  ],
})

export const metadata: Metadata = {
  title: {
    default: 'THRYRA',
    template: '%s | THRYRA',
  },
  description: 'La plataforma de entrenamiento para coaches y atletas de Latinoamérica.',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/favicon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#6366F1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${montserrat.variable}`}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
