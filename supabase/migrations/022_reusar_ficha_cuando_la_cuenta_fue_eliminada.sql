-- ─────────────────────────────────────────────────────────────────────────────
-- Registrarse otra vez tras eliminar la cuenta fallaba con un error opaco
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Al eliminar una cuenta de acceso se borra la fila de auth.users, pero la fila
-- de public.users y la ficha de atleta se quedan. La ficha conserva su user_id
-- apuntando a un perfil cuya cuenta ya no existe.
--
-- El trigger buscaba la ficha con "user_id IS NULL" para reutilizarla. Como
-- esta tenía user_id puesto —aunque apuntara a la nada— no la encontraba, e
-- intentaba INSERTAR otra con el mismo correo. Eso choca contra el índice único
-- athletes_correo_unico_por_box que agregó la 018, el trigger falla y el
-- registro entero se cae. En pantalla se veía un "{}", porque el formulario
-- mostraba el error de Postgres sin traducir.
--
-- Es un problema que se creó al arreglar otro: sin ese índice, el registro
-- habría "funcionado" creando la ficha duplicada de siempre. El índice hizo
-- visible el fallo, pero no era la causa.
--
-- Ahora una ficha se puede reutilizar en dos casos:
--   a) no tiene cuenta (user_id IS NULL)
--   b) la cuenta a la que apunta ya no existe
--
-- Y al reutilizarla se retira el perfil viejo, que si no quedaría como usuario
-- fantasma en el back office: sin cuenta y sin ficha.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_tenant_id UUID;
  tenant_slug TEXT;
  invite_tenant_id UUID;
  invite_role TEXT;
  new_pub_user_id UUID;
  ficha_existente UUID;
  perfil_viejo UUID;
BEGIN
  IF NEW.raw_user_meta_data->>'org_name' IS NOT NULL THEN
    tenant_slug := lower(regexp_replace(
      NEW.raw_user_meta_data->>'org_name', '[^a-zA-Z0-9]', '-', 'g'
    )) || '-' || substr(NEW.id::text, 1, 8);

    INSERT INTO public.tenants (name, slug)
    VALUES (NEW.raw_user_meta_data->>'org_name', tenant_slug)
    RETURNING id INTO new_tenant_id;

    INSERT INTO public.users (tenant_id, auth_user_id, role, first_name, last_name)
    VALUES (new_tenant_id, NEW.id, 'super_admin',
            COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuario'),
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''));

    INSERT INTO public.subscriptions (tenant_id, plan_tier, status, trial_ends_at)
    VALUES (new_tenant_id, 'trial', 'trialing', NOW() + INTERVAL '30 days');

    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data ||
      jsonb_build_object('tenant_id', new_tenant_id, 'role', 'super_admin')
    WHERE id = NEW.id;

    RETURN NEW;
  END IF;

  invite_tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;
  invite_role := COALESCE(NEW.raw_user_meta_data->>'role', 'athlete');

  IF invite_tenant_id IS NOT NULL THEN
    INSERT INTO public.users (tenant_id, auth_user_id, role, first_name, last_name)
    VALUES (invite_tenant_id, NEW.id, invite_role,
            COALESCE(NEW.raw_user_meta_data->>'first_name', 'Usuario'),
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''))
    RETURNING id INTO new_pub_user_id;

    IF invite_role = 'athlete' THEN
      -- Reutilizable si no tiene cuenta, o si la que tenía ya no existe.
      SELECT a.id, a.user_id INTO ficha_existente, perfil_viejo
      FROM public.athletes a
      LEFT JOIN public.users u  ON u.id = a.user_id
      LEFT JOIN auth.users  au  ON au.id = u.auth_user_id
      WHERE a.tenant_id = invite_tenant_id
        AND lower(trim(a.email)) = lower(trim(NEW.email))
        AND (a.user_id IS NULL OR au.id IS NULL)
      ORDER BY a.created_at
      LIMIT 1;

      -- Respaldo: ficha sin correo, identificada por nombre e invitación.
      IF ficha_existente IS NULL THEN
        SELECT a.id INTO ficha_existente
        FROM public.athletes a
        JOIN public.invitations i
          ON lower(trim(i.email)) = lower(trim(NEW.email))
         AND i.tenant_id = invite_tenant_id
        WHERE a.tenant_id = invite_tenant_id
          AND a.user_id IS NULL
          AND (a.email IS NULL OR trim(a.email) = '')
          AND lower(trim(a.first_name)) = lower(trim(COALESCE(NEW.raw_user_meta_data->>'first_name','')))
        ORDER BY a.created_at
        LIMIT 1;
      END IF;

      IF ficha_existente IS NOT NULL THEN
        UPDATE public.athletes
        SET user_id    = new_pub_user_id,
            email      = COALESCE(NULLIF(trim(email), ''), NEW.email),
            deleted_at = NULL,
            status     = 'active',
            first_name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'first_name',''), first_name),
            last_name  = COALESCE(NULLIF(NEW.raw_user_meta_data->>'last_name',''),  last_name)
        WHERE id = ficha_existente;

        IF perfil_viejo IS NOT NULL AND perfil_viejo <> new_pub_user_id THEN
          DELETE FROM public.users
          WHERE id = perfil_viejo
            AND NOT EXISTS (SELECT 1 FROM auth.users au2 WHERE au2.id = users.auth_user_id);
        END IF;
      ELSE
        INSERT INTO public.athletes (tenant_id, user_id, first_name, last_name, email, status)
        VALUES (invite_tenant_id, new_pub_user_id,
                COALESCE(NEW.raw_user_meta_data->>'first_name', 'Atleta'),
                COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
                NEW.email, 'active');
      END IF;
    END IF;

    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data ||
      jsonb_build_object('tenant_id', invite_tenant_id, 'role', invite_role)
    WHERE id = NEW.id;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;
