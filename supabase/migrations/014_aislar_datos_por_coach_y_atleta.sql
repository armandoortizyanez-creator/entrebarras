-- ─────────────────────────────────────────────────────────────────────────────
-- Cada coach ve lo suyo; cada atleta ve lo suyo
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Un coach recién creado, sin una sola rutina propia, ya veía las rutinas de
-- los otros coaches del box. Lo mismo con WODs, grupos y asignaciones.
--
-- ADVERTENCIA PARA QUIEN LEA ESTO DESPUÉS: las políticas que había en la base
-- NO coincidían con las de los archivos de migración de este repositorio.
-- Varias se corrigieron en algún momento directamente sobre el servidor. Esta
-- migración se escribió leyendo pg_policies, no los archivos. Antes de tocar
-- RLS acá, conviene volver a consultar el estado real:
--
--   SELECT tablename, policyname, cmd, qual FROM pg_policies
--   WHERE schemaname = 'public' ORDER BY tablename, policyname;
--
-- Las políticas se suman con OR: si se deja viva una permisiva, agregar otra
-- más estricta no cierra nada.
--
-- Lo que estaba abierto de más:
--   routines_staff  -> cualquier coach del box veía TODAS las rutinas
--   wods_tenant     -> cualquiera del box, incluidos los atletas, veía todos
--   groups_tenant_read -> lectura de todos los grupos para todo el gimnasio
--   athlete_routines.tenant_read / tenant_write -> todas las asignaciones
--   rblocks_tenant / rex_tenant -> el contenido de rutinas ajenas seguía
--                                  siendo legible aunque la rutina no saliera

-- ─── ROUTINES ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "routines_staff" ON routines;

CREATE POLICY "routines_admin" ON routines FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'super_admin');

CREATE POLICY "routines_coach_own" ON routines FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'coach'
         AND created_by = get_public_user_id());

-- La lectura del atleta ya existía y estaba bien escrita (routines_athlete).

-- ─── WODS ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "wods_tenant" ON wods;

CREATE POLICY "wods_admin" ON wods FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'super_admin');

CREATE POLICY "wods_coach_own" ON wods FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'coach'
         AND created_by = get_public_user_id());

-- Al atleta el WOD le llega por una sesión programada.
CREATE POLICY "wods_athlete_asignados" ON wods FOR SELECT
  USING (
    tenant_id = get_tenant_id() AND get_user_role() = 'athlete'
    AND EXISTS (
      SELECT 1 FROM training_sessions s
      JOIN athletes a ON a.id = s.athlete_id
      WHERE s.wod_id = wods.id AND a.user_id = get_public_user_id()
    )
  );

-- ─── GROUPS ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "groups_tenant_read" ON groups;

CREATE POLICY "groups_coach_own_read" ON groups FOR SELECT
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'coach'
         AND (coach_id = get_public_user_id() OR is_global));

-- Ojo: la versión del atleta se corrige en la 015 por recursión.
CREATE POLICY "groups_athlete_propios" ON groups FOR SELECT
  USING (
    tenant_id = get_tenant_id() AND get_user_role() = 'athlete'
    AND EXISTS (
      SELECT 1 FROM group_athletes ga
      JOIN athletes a ON a.id = ga.athlete_id
      WHERE ga.group_id = groups.id AND a.user_id = get_public_user_id()
    )
  );

-- ─── ATHLETE_ROUTINES ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tenant_read"  ON athlete_routines;
DROP POLICY IF EXISTS "tenant_write" ON athlete_routines;
DROP POLICY IF EXISTS "athlete_routines_staff" ON athlete_routines;

CREATE POLICY "athlete_routines_platform_admin" ON athlete_routines FOR ALL
  USING (is_platform_admin());

CREATE POLICY "athlete_routines_staff" ON athlete_routines FOR ALL
  USING (EXISTS (
    SELECT 1 FROM athletes a
    WHERE a.id = athlete_routines.athlete_id
      AND a.tenant_id = get_tenant_id()
      AND (
        get_user_role() = 'super_admin'
        OR (get_user_role() = 'coach' AND a.assigned_coach_id = get_public_user_id())
      )
  ));

-- ─── BLOQUES DE RUTINA ──────────────────────────────────────────────────────
-- Ahora heredan la visibilidad de su rutina: RLS también se aplica dentro del
-- EXISTS, así que si la rutina no se ve, sus bloques tampoco.
DROP POLICY IF EXISTS "rblocks_tenant" ON routine_blocks;
DROP POLICY IF EXISTS "rex_tenant"     ON routine_exercises;

CREATE POLICY "rblocks_via_rutina" ON routine_blocks FOR ALL
  USING (EXISTS (SELECT 1 FROM routines r WHERE r.id = routine_blocks.routine_id));

CREATE POLICY "rex_via_bloque" ON routine_exercises FOR ALL
  USING (EXISTS (SELECT 1 FROM routine_blocks b WHERE b.id = routine_exercises.block_id));
