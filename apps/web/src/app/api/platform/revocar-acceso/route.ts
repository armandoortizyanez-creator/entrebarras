import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Elimina la cuenta de acceso de un usuario, conservando todo lo que creó.
 *
 * Vive en el servidor porque borrar de auth.users exige la clave de servicio,
 * que nunca debe llegar al navegador.
 *
 * No se borra la fila de public.users a propósito: si desapareciera, las
 * rutinas que esa persona creó quedarían sin autor y el historial de sus
 * atletas se rompería. Se marca `access_revoked_at` y queda como registro.
 */
export async function POST(req: NextRequest) {
  try {
    const { authUserId, email } = await req.json()
    if (!authUserId || !email) {
      return NextResponse.json({ error: 'Faltan datos de la cuenta' }, { status: 400 })
    }

    // 1. Quien llama debe ser administrador de plataforma. Se verifica contra
    //    el servidor, no contra lo que diga el cliente.
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    if (user.app_metadata?.role !== 'platform_admin') {
      return NextResponse.json(
        { error: 'Solo un administrador de plataforma puede eliminar cuentas' },
        { status: 403 }
      )
    }

    // 2. Nadie puede eliminarse a sí mismo: dejaría la plataforma sin acceso.
    if (user.id === authUserId) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta desde aquí' },
        { status: 400 }
      )
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !url) {
      return NextResponse.json(
        { error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor' },
        { status: 500 }
      )
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 3. Confirmar que el email coincide con la cuenta indicada. Evita borrar
    //    a la persona equivocada si la lista quedó desactualizada.
    const { data: objetivo, error: eBuscar } = await admin.auth.admin.getUserById(authUserId)
    if (eBuscar || !objetivo?.user) {
      return NextResponse.json({ error: 'Esa cuenta ya no existe' }, { status: 404 })
    }
    if (objetivo.user.email?.toLowerCase() !== String(email).toLowerCase()) {
      return NextResponse.json(
        { error: 'El correo no coincide con la cuenta. Recarga la lista e inténtalo de nuevo.' },
        { status: 409 }
      )
    }

    // 4. Marcar el perfil ANTES de borrar el acceso. Si el borrado fallara,
    //    queda un perfil marcado y no una cuenta huérfana sin rastro.
    const { error: eMarcar } = await admin
      .from('users')
      .update({
        is_active: false,
        access_revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', authUserId)
    if (eMarcar) {
      return NextResponse.json({ error: `No se pudo marcar el perfil: ${eMarcar.message}` }, { status: 500 })
    }

    const { error: eBorrar } = await admin.auth.admin.deleteUser(authUserId)
    if (eBorrar) {
      return NextResponse.json({ error: `No se pudo eliminar el acceso: ${eBorrar.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true, email: objetivo.user.email })
  } catch (err) {
    console.error('[platform/revocar-acceso]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
