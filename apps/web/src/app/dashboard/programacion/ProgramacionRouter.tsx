'use client'

import { useUser } from '@/hooks/useUser'
import { ProgramacionView } from './ProgramacionView'
import { ProgramacionAtletaView } from './ProgramacionAtletaView'

/**
 * "Programación" significa dos cosas distintas según quién entra.
 *
 * Para el coach es la herramienta con la que arma la semana del box. Para el
 * atleta es su agenda: qué le toca cada día. Antes ambos veían la herramienta
 * del coach, que para un atleta no tiene ningún sentido.
 */
export function ProgramacionRouter() {
  const { isAthlete } = useUser()
  return isAthlete ? <ProgramacionAtletaView /> : <ProgramacionView />
}
