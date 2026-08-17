-- ─────────────────────────────────────────────────────────────────────────────
-- Elegir el grupo del atleta al momento de invitarlo
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Antes había que invitar, esperar a que la persona aceptara, buscarla en la
-- lista de atletas y recién ahí agregarla al grupo. Cuatro pasos separados en
-- el tiempo, y el último se olvida: el atleta queda sin equipo y nadie se
-- entera hasta que falta en una programación por grupo.
--
-- Ahora la invitación lleva el grupo, y el mismo trigger que ya corre al
-- aceptar lo mete adentro.

ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

-- Al aceptar: reasigna el coach (como ya hacía) y suma al grupo elegido.
CREATE OR REPLACE FUNCTION asignar_coach_desde_invitacion()
RETURNS TRIGGER AS $$
DECLARE v_ficha UUID;
BEGIN
  IF NEW.accepted_at IS NULL OR OLD.accepted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.role <> 'athlete' OR NEW.invited_by IS NULL THEN
    RETURN NEW;
  END IF;

  -- La ficha de quien acaba de aceptar, por el correo de su cuenta.
  SELECT a.id INTO v_ficha
  FROM   athletes a
  JOIN   users u       ON u.id = a.user_id
  JOIN   auth.users au ON au.id = u.auth_user_id
  WHERE  a.tenant_id = NEW.tenant_id
    AND  lower(trim(au.email)) = lower(trim(NEW.email))
  LIMIT  1;

  IF v_ficha IS NULL THEN
    RETURN NEW;
  END IF;

  -- Invitar es decir "esta persona entrena conmigo": reasigna el coach aunque
  -- ya tuviera otro (ver migración 023).
  UPDATE athletes
  SET    assigned_coach_id = NEW.invited_by, updated_at = now()
  WHERE  id = v_ficha
    AND  assigned_coach_id IS DISTINCT FROM NEW.invited_by;

  IF NEW.group_id IS NOT NULL THEN
    INSERT INTO group_athletes (group_id, athlete_id)
    VALUES (NEW.group_id, v_ficha)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
