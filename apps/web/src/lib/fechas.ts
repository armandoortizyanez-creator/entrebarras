/**
 * YYYY-MM-DD en hora local.
 *
 * `toISOString()` convierte a UTC primero. En Chile (UTC-4) eso significa que
 * a partir de las 20:00 devuelve el día siguiente, así que "hoy" dejaba de ser
 * hoy justo a la hora en que la gente entrena. El mismo error ya había corrido
 * la programación semanal un día completo.
 */
export function aFechaLocal(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

/** Hoy, en hora local. */
export function hoyLocal(): string {
  return aFechaLocal(new Date())
}

/** Construye una fecha desde 'YYYY-MM-DD' sin que el huso la corra un día. */
export function desdeFechaLocal(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "martes 19 ago" — para encabezados de día. */
export function etiquetaDeDia(iso: string): string {
  const d = desdeFechaLocal(iso)
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`
}

/** "Hoy", "Mañana" o la etiqueta normal. */
export function etiquetaRelativa(iso: string): string {
  const hoy = hoyLocal()
  if (iso === hoy) return 'Hoy'
  const manana = new Date()
  manana.setDate(manana.getDate() + 1)
  if (iso === aFechaLocal(manana)) return 'Mañana'
  return etiquetaDeDia(iso)
}
