/**
 * Colores de las zonas de intensidad de la tabla de porcentajes.
 *
 * Viven aparte porque los usan dos pantallas: "Mis PRs" y el panel que se
 * abre dentro de una rutina. La misma barra tiene que verse igual en las dos
 * —el atleta esta leyendo el mismo dato— y tenerlo duplicado garantizaba que
 * tarde o temprano una quedara de un color y la otra de otro.
 */

export interface ZonaDePorcentaje {
  bg: string
  text: string
  /** Solo el primer porcentaje de cada tramo lleva etiqueta, para no repetirla. */
  label: string
}

export const PCT_ZONE_LIGHT: Record<number, ZonaDePorcentaje> = {
  50:  { bg: '#F0FDF4', text: '#15803D', label: 'Calentamiento' },
  55:  { bg: '#F0FDF4', text: '#15803D', label: '' },
  60:  { bg: '#F0FDF4', text: '#15803D', label: '' },
  65:  { bg: '#FFFBEB', text: '#B45309', label: 'Técnica' },
  70:  { bg: '#FFFBEB', text: '#B45309', label: '' },
  75:  { bg: '#FFFBEB', text: '#B45309', label: '' },
  80:  { bg: '#FFF7ED', text: '#C2410C', label: 'Fuerza' },
  85:  { bg: '#FFF7ED', text: '#C2410C', label: '' },
  90:  { bg: '#FEF2F2', text: '#B91C1C', label: 'Intensidad' },
  95:  { bg: '#FEF2F2', text: '#B91C1C', label: '' },
  100: { bg: 'rgba(99,102,241,0.08)', text: '#6366F1', label: '1RM' },
  105: { bg: '#F5F3FF', text: '#6D28D9', label: 'Objetivo' },
}

export const PCT_ZONE_DARK: Record<number, ZonaDePorcentaje> = {
  50:  { bg: 'rgba(74,222,128,0.08)',  text: '#4ADE80', label: 'Calentamiento' },
  55:  { bg: 'rgba(74,222,128,0.08)',  text: '#4ADE80', label: '' },
  60:  { bg: 'rgba(74,222,128,0.08)',  text: '#4ADE80', label: '' },
  65:  { bg: 'rgba(251,191,36,0.08)',  text: '#FBBF24', label: 'Técnica' },
  70:  { bg: 'rgba(251,191,36,0.08)',  text: '#FBBF24', label: '' },
  75:  { bg: 'rgba(251,191,36,0.08)',  text: '#FBBF24', label: '' },
  80:  { bg: 'rgba(251,146,60,0.08)',  text: '#FB923C', label: 'Fuerza' },
  85:  { bg: 'rgba(251,146,60,0.08)',  text: '#FB923C', label: '' },
  90:  { bg: 'rgba(239,68,68,0.08)',   text: '#F87171', label: 'Intensidad' },
  95:  { bg: 'rgba(239,68,68,0.08)',   text: '#F87171', label: '' },
  100: { bg: 'rgba(99,102,241,0.12)',  text: '#818CF8', label: '1RM' },
  105: { bg: 'rgba(167,139,250,0.10)', text: '#A78BFA', label: 'Objetivo' },
}

export function zonasDePorcentaje(isLight: boolean): Record<number, ZonaDePorcentaje> {
  return isLight ? PCT_ZONE_LIGHT : PCT_ZONE_DARK
}
