-- ─────────────────────────────────────────────────────────────────────────────
-- Un coach dejó de ver a un atleta suyo: se le asignó el coach equivocado
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Error introducido por la migración 013. Su relleno de assigned_coach_id unía
-- invitations por correo así:
--
--   JOIN invitations i ON lower(i.email) = lower(au.email)
--   ... AND i.accepted_at IS NOT NULL AND i.invited_by IS NOT NULL
--
-- Sin filtrar por rol y sin ordenar por fecha. Una misma persona puede tener
-- varias invitaciones al mismo box: en el caso real había cuatro para el mismo
-- correo —dos como coach y dos como atleta, en momentos distintos— y el relleno
-- tomó una cualquiera.
--
-- Quedó apuntando a quien lo había invitado como COACH dos horas antes, en vez
-- del coach que lo invitó como ATLETA. El síntoma fue que ese coach dejó de ver
-- a su propio atleta en la lista, porque athletes_coach_manage filtra por
-- assigned_coach_id.
--
-- La misma imprecisión estaba en asignar_coach_a_atleta_nuevo, que ordenaba por
-- fecha pero tampoco exigía que la invitación fuera de atleta.

-- ─── 1. La función, ahora exigiendo invitación de atleta ────────────────────

CREATE OR REPLACE FUNCTION asignar_coach_a_atleta_nuevo()
RETURNS TRIGGER AS $$
DECLARE
  v_coach UUID;
BEGIN
  IF NEW.assigned_coach_id IS NOT NULL OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT i.invited_by INTO v_coach
  FROM   invitations i
  JOIN   users u       ON u.id = NEW.user_id
  JOIN   auth.users au ON au.id = u.auth_user_id
  WHERE  lower(trim(i.email)) = lower(trim(au.email))
    AND  i.tenant_id   = NEW.tenant_id
    AND  i.role        = 'athlete'
    AND  i.accepted_at IS NOT NULL
    AND  i.invited_by  IS NOT NULL
  ORDER  BY i.accepted_at DESC
  LIMIT  1;

  IF v_coach IS NOT NULL THEN
    NEW.assigned_coach_id := v_coach;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 2. Corregir las fichas mal apuntadas ───────────────────────────────────
-- Solo toca aquellas donde existe una invitación de ATLETA aceptada cuyo autor
-- no coincide con el coach actual. Las fichas cargadas a mano, que no tienen
-- invitación detrás, no se tocan.

UPDATE athletes a
SET    assigned_coach_id = (
         SELECT i.invited_by
         FROM   invitations i
         JOIN   users u2       ON u2.id = a.user_id
         JOIN   auth.users au2 ON au2.id = u2.auth_user_id
         WHERE  lower(trim(i.email)) = lower(trim(au2.email))
           AND  i.tenant_id   = a.tenant_id
           AND  i.role        = 'athlete'
           AND  i.accepted_at IS NOT NULL
           AND  i.invited_by  IS NOT NULL
         ORDER  BY i.accepted_at DESC
         LIMIT  1
       ),
       updated_at = now()
WHERE  a.user_id IS NOT NULL
  AND  EXISTS (
         SELECT 1
         FROM   invitations i
         JOIN   users u2       ON u2.id = a.user_id
         JOIN   auth.users au2 ON au2.id = u2.auth_user_id
         WHERE  lower(trim(i.email)) = lower(trim(au2.email))
           AND  i.tenant_id   = a.tenant_id
           AND  i.role        = 'athlete'
           AND  i.accepted_at IS NOT NULL
           AND  i.invited_by  IS NOT NULL
           AND  i.invited_by IS DISTINCT FROM a.assigned_coach_id
       );
