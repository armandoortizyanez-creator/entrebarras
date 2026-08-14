-- Migration 008: corregir politicas que confundian auth.uid() con users.id
--
-- Barrida completa tras encontrar el mismo error cinco veces. auth.uid() es el
-- id de auth.users; las columnas de abajo guardan users.id (el id publico).
-- Comparar uno contra otro nunca coincide, asi que las politicas bloqueaban
-- todo en silencio.
--
-- Auditoria previa de datos: 0 filas contaminadas en las 12 columnas que
-- referencian users.id, asi que no hace falta migrar datos.

-- 1) El atleta no podia ver ni registrar sus propias mediciones
DROP POLICY IF EXISTS measurements_athlete_self ON body_measurements;
CREATE POLICY measurements_athlete_self ON body_measurements
  FOR ALL TO authenticated
  USING (
    athlete_id IN (
      SELECT a.id FROM athletes a
      WHERE a.user_id = get_public_user_id() AND a.deleted_at IS NULL
    )
  )
  WITH CHECK (
    athlete_id IN (
      SELECT a.id FROM athletes a
      WHERE a.user_id = get_public_user_id() AND a.deleted_at IS NULL
    )
  );

-- 2) El coach no podia ver las mediciones de sus atletas
DROP POLICY IF EXISTS measurements_coach ON body_measurements;
CREATE POLICY measurements_coach ON body_measurements
  FOR ALL TO authenticated
  USING (
    get_user_role() = 'coach'
    AND athlete_id IN (
      SELECT a.id FROM athletes a
      WHERE a.tenant_id = get_tenant_id()
        AND a.assigned_coach_id = get_public_user_id()
    )
  )
  WITH CHECK (
    get_user_role() = 'coach'
    AND athlete_id IN (
      SELECT a.id FROM athletes a
      WHERE a.tenant_id = get_tenant_id()
        AND a.assigned_coach_id = get_public_user_id()
    )
  );

-- 3) El coach no podia crear ni administrar sus propios grupos
DROP POLICY IF EXISTS groups_coach_manage ON groups;
CREATE POLICY groups_coach_manage ON groups
  FOR ALL TO authenticated
  USING (
    tenant_id = get_tenant_id()
    AND get_user_role() = 'coach'
    AND coach_id = get_public_user_id()
  )
  WITH CHECK (
    tenant_id = get_tenant_id()
    AND get_user_role() = 'coach'
    AND coach_id = get_public_user_id()
  );
