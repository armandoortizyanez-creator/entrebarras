-- ─────────────────────────────────────────────────────────────────────────────
-- Quien re-invita a un atleta que ya existe no lo recibe
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Un coach invitaba a alguien que YA existía como atleta del box, la persona
-- aceptaba, y la ficha seguía con el coach anterior. El coach que invitó no lo
-- veía nunca en su lista.
--
-- Caso real: la misma persona tenía dos invitaciones de atleta aceptadas, de
-- coaches distintos, con un día de diferencia. La ficha se quedó con el primero.
--
-- Dos huecos que se tapaban entre sí:
--
--   asignar_coach_a_atleta_nuevo  es BEFORE INSERT. Desde que la ficha se
--     REUTILIZA (migración 022) el alta pasó a ser un UPDATE, así que este
--     trigger dejó de dispararse en el camino más común.
--
--   asignar_coach_desde_invitacion  solo escribía el coach cuando el campo
--     estaba en NULL. Se hizo así para no pisar asignaciones manuales, pero una
--     invitación aceptada no es un accidente: es alguien diciendo
--     explícitamente "esta persona entrena conmigo".
--
-- Aceptar una invitación de atleta ahora reasigna el coach a quien invitó. Si
-- el atleta era de otro coach, se mueve. Eso es lo que significa invitar.

CREATE OR REPLACE FUNCTION asignar_coach_desde_invitacion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.accepted_at IS NULL OR OLD.accepted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.role <> 'athlete' OR NEW.invited_by IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE athletes a
  SET    assigned_coach_id = NEW.invited_by,
         updated_at        = now()
  FROM   users u
  JOIN   auth.users au ON au.id = u.auth_user_id
  WHERE  a.user_id  = u.id
    AND  a.tenant_id = NEW.tenant_id
    AND  lower(trim(au.email)) = lower(trim(NEW.email))
    AND  a.assigned_coach_id IS DISTINCT FROM NEW.invited_by;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Corregir los casos ya ocurridos: fichas cuyo coach no coincide con el de su
-- invitación de atleta aceptada más reciente.
UPDATE athletes a
SET    assigned_coach_id = (
         SELECT i.invited_by FROM invitations i
         JOIN users u2 ON u2.id = a.user_id
         JOIN auth.users au2 ON au2.id = u2.auth_user_id
         WHERE lower(trim(i.email)) = lower(trim(au2.email))
           AND i.tenant_id = a.tenant_id AND i.role = 'athlete'
           AND i.accepted_at IS NOT NULL AND i.invited_by IS NOT NULL
         ORDER BY i.accepted_at DESC LIMIT 1),
       updated_at = now()
WHERE  a.user_id IS NOT NULL
  AND  EXISTS (
         SELECT 1 FROM invitations i
         JOIN users u2 ON u2.id = a.user_id
         JOIN auth.users au2 ON au2.id = u2.auth_user_id
         WHERE lower(trim(i.email)) = lower(trim(au2.email))
           AND i.tenant_id = a.tenant_id AND i.role = 'athlete'
           AND i.accepted_at IS NOT NULL AND i.invited_by IS NOT NULL
           AND i.invited_by IS DISTINCT FROM a.assigned_coach_id);
