'use client'

import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { Toaster, mostrarError } from '@/components/feedback/Toaster'
import { mensajeDeError } from '@/lib/errors'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        /**
         * Red de seguridad para fallos silenciosos.
         *
         * La mayoría de las mutaciones no definía onError, así que un guardado
         * rechazado no mostraba nada: el usuario creía que había funcionado.
         * Así fue como Programación estuvo sin guardar nada sin que nadie lo
         * notara.
         *
         * Este onError global cubre toda mutación, presente y futura. Se salta
         * las que ya traen su propio onError para no duplicar el aviso, porque
         * esas ya muestran el error donde corresponde.
         */
        mutationCache: new MutationCache({
          onError: (error, _vars, _ctx, mutation) => {
            if (mutation.options.onError) return
            mostrarError(mensajeDeError(error, 'No se pudo guardar el cambio'))
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  )

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
