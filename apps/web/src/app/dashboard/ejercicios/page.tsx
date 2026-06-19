import type { Metadata } from 'next'
import { EjerciciosView } from './EjerciciosView'
export const metadata: Metadata = { title: 'Ejercicios' }
export default function EjerciciosPage() {
  return <EjerciciosView />
}
