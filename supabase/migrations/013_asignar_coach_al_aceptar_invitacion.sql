-- ─────────────────────────────────────────────────────────────────────────────
-- Al aceptar una invitación, el atleta queda sin coach asignado
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Sintoma: una persona invitada por un coach crea su cuenta desde el enlace,
-- entra bien, aparece en la lista de atletas del box... y con
-- assigned_coach_id en NULL. El coach que la invitó no la ve como suya. Los
-- únicos atletas con coach eran los cargados a mano.
--
-- Causa: la invitación guarda quién invitó en invited_by, pero nadie copia ese
-- dato al atleta. accept_invitation solo marca accepted_at.
--
-- Por qué la solución va por triggers y no por modificar accept_invitation:
-- esa función y handle_new_user viven solo en la base, no están en ninguna
-- migración de este repositorio. Reemplazarlas a ciegas arriesga borrar
-- comportamiento que no se puede leer. Esto es aditivo: si mañana aparecen sus
-- definiciones, siguen funcionando igual.
--
-- Se cubren los dos ordenes posibles, porque no se puede verificar cuál ocurre:
--   a) el atleta ya existe cuando se acepta  -> dispara el trigger de invitations
--   b) el atleta se crea después de aceptar  -> dispara el trigger de athletes
-- Ambos son idempotentes y solo escriben si assigned_coach_id está en NULL, así
-- que nunca pisan una asignación hecha a mano.

-- ─── 1. Al marcar la invitación como aceptada ───────────────────────────────

CREATE OR REPLACE FUNCTION asignar_coach_desde_invitacion()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo cuando accepted_at pasa de NULL a tener valor.
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
    AND  lower(au.email) = lower(NEW.email)
    AND  a.assigned_coach_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_asignar_coach_al_aceptar ON invitations;
CREATE TRIGGER trg_asignar_coach_al_aceptar
  AFTER UPDATE OF accepted_at ON invitations
  FOR EACH ROW EXECUTE FUNCTION asignar_coach_desde_invitacion();

-- ─── 2. Al crear el atleta ──────────────────────────────────────────────────
-- Cubre el caso inverso: el alta del atleta ocurre después de aceptar.

CREATE OR REPLACE FUNCTION asignar_coach_a_atleta_nuevo()
RETURNS TRIGGER AS $$
DECLARE
  v_coach UUID;
BEGIN
  IF NEW.assigned_coach_id IS NOT NULL OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- La invitación aceptada más reciente para el correo de esta persona.
  SELECT i.invited_by INTO v_coach
  FROM   invitations i
  JOIN   users u      ON u.id = NEW.user_id
  JOIN   auth.users au ON au.id = u.auth_user_id
  WHERE  lower(i.email) = lower(au.email)
    AND  i.tenant_id    = NEW.tenant_id
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

DROP TRIGGER IF EXISTS trg_asignar_coach_atleta_nuevo ON athletes;
CREATE TRIGGER trg_asignar_coach_atleta_nuevo
  BEFORE INSERT ON athletes
  FOR EACH ROW EXECUTE FUNCTION asignar_coach_a_atleta_nuevo();

-- ─── 3. Reparar lo ya existente ─────────────────────────────────────────────
-- Atletas que entraron por invitación y quedaron sueltos.

UPDATE athletes a
SET    assigned_coach_id = i.invited_by,
       updated_at        = now()
FROM   users u
JOIN   auth.users au ON au.id = u.auth_user_id
JOIN   invitations i ON lower(i.email) = lower(au.email)
WHERE  a.user_id = u.id
  AND  a.tenant_id = i.tenant_id
  AND  a.assigned_coach_id IS NULL
  AND  i.accepted_at IS NOT NULL
  AND  i.invited_by IS NOT NULL;
