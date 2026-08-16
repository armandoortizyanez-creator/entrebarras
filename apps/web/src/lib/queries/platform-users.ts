import { createClient } from '@/lib/supabase/client'

export interface UsuarioPlataforma {
  auth_user_id: string
  user_id: string | null
  email: string
  nombre: string | null
  rol: string | null
  gym_id: string | null
  gym: string | null
  equipos: string[]
  ultimo_acceso: string | null
  registrado: string
  email_confirmado: boolean
  activo: boolean
  acceso_revocado: string | null
  sin_perfil: boolean
}

/**
 * Todos los usuarios de la plataforma, de todos los gimnasios.
 *
 * Va por una función en la base y no por una consulta normal porque auth.users
 * no es accesible desde el cliente. La función comprueba el rol antes de
 * devolver nada: un coach o el admin de un box reciben un error.
 */
export async function getUsuariosPlataforma(): Promise<UsuarioPlataforma[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('platform_listar_usuarios')
  if (error) throw error
  return (data ?? []) as UsuarioPlataforma[]
}

/** Inhabilita el ingreso sin borrar nada. Se puede deshacer. */
export async function desactivarUsuario(userId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('users')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

export async function reactivarUsuario(userId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('users')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

/**
 * Elimina la cuenta de acceso conservando lo que la persona creó.
 *
 * Pasa por el servidor porque borrar de auth.users exige la clave de servicio.
 * Se envía también el email para que el servidor confirme que se está borrando
 * la cuenta correcta y no otra por una lista desactualizada.
 */
export async function eliminarAcceso(authUserId: string, email: string) {
  const res = await fetch('/api/platform/revocar-acceso', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authUserId, email }),
  })
  const cuerpo = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(cuerpo.error ?? 'No se pudo eliminar la cuenta')
  return cuerpo as { ok: true; email: string }
}
