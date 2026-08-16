-- Migration 012: back office de plataforma — listado de todos los usuarios
--
-- Marca cuando se le quito el acceso a alguien de forma definitiva, para
-- distinguirlo de una desactivacion temporal (is_active = false). El perfil se
-- conserva para no perder la autoria de rutinas ni el historial de sus atletas.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS access_revoked_at TIMESTAMPTZ;

COMMENT ON COLUMN users.access_revoked_at IS
  'Fecha en que se elimino la cuenta de acceso. El perfil se conserva a proposito.';

-- El CHECK de users.role no incluia 'platform_admin', aunque la app usa ese rol
-- en el JWT y en ROLE_LABELS. Por eso el unico administrador de plataforma no
-- podia tener perfil: crearlo violaba la restriccion.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role = ANY (ARRAY['platform_admin','super_admin','coach','athlete']));

/**
 * Listado de todos los usuarios de la plataforma, de todos los gimnasios.
 *
 * auth.users no es accesible desde el cliente, asi que hace falta SECURITY
 * DEFINER. La comprobacion de rol es lo primero que corre: sin ella, cualquier
 * usuario autenticado podria leer los correos de toda la plataforma.
 */
CREATE OR REPLACE FUNCTION public.platform_listar_usuarios()
RETURNS TABLE (
  auth_user_id uuid, user_id uuid, email text, nombre text, rol text,
  gym_id uuid, gym text, equipos text[],
  ultimo_acceso timestamptz, registrado timestamptz,
  email_confirmado boolean, activo boolean,
  acceso_revocado timestamptz, sin_perfil boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
BEGIN
  IF NOT is_platform_admin() THEN
    RAISE EXCEPTION 'Solo un administrador de plataforma puede ver este listado';
  END IF;

  RETURN QUERY
  SELECT au.id, u.id, au.email::text,
    NULLIF(btrim(COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')), '')::text,
    COALESCE(u.role, au.raw_app_meta_data->>'role')::text,
    u.tenant_id, t.name::text,
    COALESCE((
      SELECT array_agg(DISTINCT g.name ORDER BY g.name)
      FROM athletes a
      JOIN group_athletes ga ON ga.athlete_id = a.id
      JOIN groups g ON g.id = ga.group_id
      WHERE a.user_id = u.id AND a.deleted_at IS NULL
    ), ARRAY[]::text[]),
    au.last_sign_in_at, au.created_at,
    au.email_confirmed_at IS NOT NULL,
    COALESCE(u.is_active, true), u.access_revoked_at, u.id IS NULL
  FROM auth.users au
  LEFT JOIN public.users u ON u.auth_user_id = au.id
  LEFT JOIN public.tenants t ON t.id = u.tenant_id
  ORDER BY au.last_sign_in_at DESC NULLS LAST;
END;
$$;

REVOKE ALL ON FUNCTION public.platform_listar_usuarios() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.platform_listar_usuarios() TO authenticated;
