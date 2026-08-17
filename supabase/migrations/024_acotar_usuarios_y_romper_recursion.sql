-- ─────────────────────────────────────────────────────────────────────────────
-- Hallazgos de la pasada de QA completa
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Cualquiera del box leía la ficha de todos los usuarios ──────────────
--
-- users_same_tenant era FOR SELECT USING (tenant_id = get_tenant_id()). Un
-- atleta recién creado leía nombre, correo y rol de toda la plantilla del box,
-- coaches ajenos incluidos.
--
-- Se reemplaza por el mínimo que la app necesita para mostrar nombres:
--   todos            su propia fila
--   coach            además, la de sus atletas asignados
--   atleta           además, la de su coach
--   super_admin      todo el box (ya lo cubre users_super_admin_manage)
--   platform_admin   todo (ya lo cubre users_platform_admin)

DROP POLICY IF EXISTS "users_same_tenant" ON users;

CREATE POLICY "users_propia_fila" ON users FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "users_coach_ve_sus_atletas" ON users FOR SELECT
  USING (
    tenant_id = get_tenant_id() AND get_user_role() = 'coach'
    AND EXISTS (
      SELECT 1 FROM athletes a
      WHERE a.user_id = users.id
        AND a.assigned_coach_id = get_public_user_id()
    )
  );

CREATE POLICY "users_atleta_ve_su_coach" ON users FOR SELECT
  USING (
    tenant_id = get_tenant_id() AND get_user_role() = 'athlete'
    AND EXISTS (
      SELECT 1 FROM athletes a
      WHERE a.assigned_coach_id = users.id
        AND a.user_id = get_public_user_id()
    )
  );

-- ─── 2. get_public_user_id() no era SECURITY DEFINER ────────────────────────
--
-- La función hace "SELECT id FROM users WHERE auth_user_id = auth.uid()" y se
-- evaluaba con las políticas de users. Mientras esa política fue trivial no se
-- notó, pero en cuanto pasó a depender de athletes —que a su vez usa esta
-- función— el ciclo se cerró y CUALQUIER consulta moría con:
--
--   54001: stack depth limit exceeded
--
-- Es la tercera vez que aparece esta clase de recursión (groups y
-- group_athletes fue la primera, en la 015). La regla que conviene recordar:
-- si una función auxiliar consulta una tabla con políticas, y esas políticas
-- pueden llamar a la función, tiene que ser SECURITY DEFINER.
--
-- Este bloque va DESPUÉS del anterior a propósito: es el que lo hace viable.

CREATE OR REPLACE FUNCTION get_public_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
