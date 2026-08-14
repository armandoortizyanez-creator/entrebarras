-- Migration 007: corregir la politica de group_athletes para coaches
--
-- groups.coach_id referencia users.id (el id publico), pero la politica lo
-- comparaba con auth.uid() (el id de auth). Son UUID distintos, asi que la
-- condicion nunca se cumplia y un coach no podia agregar ni quitar atletas de
-- sus propios grupos. Solo los super_admin podian, por la otra politica.

DROP POLICY IF EXISTS group_athletes_coach ON group_athletes;
CREATE POLICY group_athletes_coach ON group_athletes
  FOR ALL TO authenticated
  USING (
    group_id IN (
      SELECT g.id FROM groups g
      WHERE g.coach_id = get_public_user_id()
        AND g.tenant_id = get_tenant_id()
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT g.id FROM groups g
      WHERE g.coach_id = get_public_user_id()
        AND g.tenant_id = get_tenant_id()
    )
  );
