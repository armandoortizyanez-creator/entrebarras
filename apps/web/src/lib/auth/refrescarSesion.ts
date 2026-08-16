import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Vuelve a emitir el token después de registrarse.
 *
 * `signUp()` entrega la sesión en el momento, pero el trigger `handle_new_user`
 * asigna `tenant_id` y `role` en `app_metadata` durante ese mismo insert. Esos
 * valores viajan FIRMADOS dentro del JWT, así que el token recién emitido no
 * los lleva y no se actualiza solo.
 *
 * Consecuencia: la persona entraba al dashboard con un token sin `tenant_id`,
 * `get_tenant_id()` devolvía NULL y toda escritura moría con violación de RLS.
 * Se veía como "no tienes permisos" al invitar a un atleta, crear una rutina o
 * casi cualquier cosa, hasta que cerrara sesión y volviera a entrar.
 *
 * `refreshSession()` pide un token nuevo con el refresh token, y ese sí se
 * construye con el `app_metadata` actual.
 */
export async function refrescarSesionConMetadatos(
  supabase: SupabaseClient,
  intentos = 3
): Promise<boolean> {
  for (let i = 0; i < intentos; i++) {
    const { data, error } = await supabase.auth.refreshSession()

    if (!error && data.session?.user.app_metadata?.tenant_id) {
      return true
    }

    // El trigger corre dentro del insert, así que normalmente basta el primer
    // intento. La espera breve cubre el caso de una réplica que va atrasada.
    if (i < intentos - 1) {
      await new Promise(r => setTimeout(r, 400 * (i + 1)))
    }
  }
  return false
}
