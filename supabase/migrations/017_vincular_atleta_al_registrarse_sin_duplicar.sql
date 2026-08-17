-- ─────────────────────────────────────────────────────────────────────────────
-- El coach asignaba rutinas a una ficha y el atleta entraba con otra
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Síntoma: un coach guardaba y asignaba rutinas sin ningún error, y a sus
-- atletas no les aparecía nada. No era permisos ni asignación: eran FICHAS
-- DUPLICADAS. El coach creaba el atleta a mano y, cuando la persona aceptaba
-- la invitación, se creaba una SEGUNDA ficha en vez de vincular la existente.
-- Las asignaciones quedaban en una y la sesión de la persona en la otra.
--
-- handle_new_user sí intentaba vincular, pero con:
--
--   WHERE email = NEW.email AND user_id IS NULL AND tenant_id = ...
--
-- Ese `=` distingue mayúsculas y no ignora espacios. Casos reales encontrados:
--
--   "Shey.almedo@gmail.com"  vs  "shey.almedo@gmail.com"   -> no coincidía
--   ficha creada sin correo                                 -> nunca coincidía
--
-- Al no encontrar nada, caía en el INSERT y creaba el duplicado.
--
-- Nota: esta función vivía SOLO en la base, no estaba en ninguna migración de
-- este repositorio. Queda versionada acá.

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
      -- Comparación normalizada: sin mayúsculas ni espacios sobrantes.
      SELECT a.id INTO ficha_existente
      FROM public.athletes a
      WHERE a.tenant_id = invite_tenant_id
        AND a.user_id IS NULL
        AND lower(trim(a.email)) = lower(trim(NEW.email))
      ORDER BY a.created_at
      LIMIT 1;

      -- Respaldo para la ficha creada sin correo: se busca por el nombre,
      -- limitado a quien tenga una invitación en este mismo gimnasio.
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
        SET user_id = new_pub_user_id,
            email   = COALESCE(NULLIF(trim(email), ''), NEW.email)
        WHERE id = ficha_existente;
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

-- ─── Reparación de lo ya duplicado ──────────────────────────────────────────
-- Mueve todo lo que cuelga de la ficha suelta a la que sí tiene cuenta, para
-- los grupos donde el correo lo resuelve sin ambigüedad.

DO $$
DECLARE g RECORD; o RECORD;
BEGIN
  FOR g IN
    SELECT lower(trim(a.email)) AS correo, a.tenant_id,
           (array_agg(a.id) FILTER (WHERE a.user_id IS NOT NULL))[1] AS destino
    FROM athletes a
    WHERE a.email IS NOT NULL AND trim(a.email) <> ''
    GROUP BY lower(trim(a.email)), a.tenant_id
    HAVING count(*) > 1 AND count(*) FILTER (WHERE a.user_id IS NOT NULL) = 1
  LOOP
    FOR o IN
      SELECT id FROM athletes
      WHERE lower(trim(email)) = g.correo AND tenant_id = g.tenant_id AND user_id IS NULL
    LOOP
      -- UNIQUE(athlete_id, routine_id): mover solo lo que falte en el destino.
      UPDATE athlete_routines ar SET athlete_id = g.destino
      WHERE ar.athlete_id = o.id
        AND NOT EXISTS (SELECT 1 FROM athlete_routines d
                        WHERE d.athlete_id = g.destino AND d.routine_id = ar.routine_id);
      DELETE FROM athlete_routines WHERE athlete_id = o.id;

      -- PK compuesta (group_id, athlete_id): mismo criterio.
      UPDATE group_athletes ga SET athlete_id = g.destino
      WHERE ga.athlete_id = o.id
        AND NOT EXISTS (SELECT 1 FROM group_athletes d
                        WHERE d.athlete_id = g.destino AND d.group_id = ga.group_id);
      DELETE FROM group_athletes WHERE athlete_id = o.id;

      UPDATE training_sessions SET athlete_id = g.destino WHERE athlete_id = o.id;
      UPDATE personal_records  SET athlete_id = g.destino WHERE athlete_id = o.id;
      UPDATE wod_results       SET athlete_id = g.destino WHERE athlete_id = o.id;
      UPDATE body_measurements SET athlete_id = g.destino WHERE athlete_id = o.id;
      UPDATE session_logs      SET athlete_id = g.destino WHERE athlete_id = o.id;
    END LOOP;
  END LOOP;
END $$;
