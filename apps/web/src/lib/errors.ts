/**
 * Los errores de Supabase son objetos planos, no instancias de Error. Por eso
 * `err instanceof Error ? err.message : 'Error'` los descartaba y la UI mostraba
 * siempre un mensaje genérico, escondiendo la causa real.
 */
export function mensajeDeError(err: unknown, porDefecto = 'Algo salió mal'): string {
  if (typeof err === 'string' && err.trim()) return err

  if (err instanceof Error && err.message) return traducir(err.message)

  if (err && typeof err === 'object') {
    const e = err as { message?: string; details?: string; hint?: string; code?: string }
    const partes = [e.message, e.details, e.hint].filter(
      (p): p is string => typeof p === 'string' && p.trim().length > 0
    )
    if (partes.length > 0) return traducir(partes.join(' — '))
    if (e.code) return `${porDefecto} (código ${e.code})`
  }

  return porDefecto
}

/**
 * Los errores crudos de Postgres no le dicen nada a un coach. Se traducen los
 * más frecuentes; el resto pasa tal cual para no ocultar información al depurar.
 */
function traducir(mensaje: string): string {
  const m = mensaje.toLowerCase()

  if (m.includes('row-level security') || m.includes('violates row-level security')) {
    return 'No tienes permisos para hacer esto. Si crees que es un error, avísale al administrador de tu box.'
  }
  if (m.includes('duplicate key') || m.includes('already exists')) {
    return 'Eso ya existe. Revisa si lo creaste antes.'
  }
  if (m.includes('foreign key')) {
    return 'No se puede completar porque hay información relacionada que depende de esto.'
  }
  if (m.includes('not-null') || m.includes('null value in column')) {
    return 'Falta un dato obligatorio.'
  }
  if (m.includes('failed to fetch') || m.includes('networkerror')) {
    return 'Sin conexión. Revisa tu internet y vuelve a intentar.'
  }
  if (m.includes('jwt') || m.includes('not authenticated')) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.'
  }
  return mensaje
}
