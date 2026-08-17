-- ─────────────────────────────────────────────────────────────────────────────
-- Recursión infinita al leer grupos
-- ─────────────────────────────────────────────────────────────────────────────
--
-- La política groups_athlete_propios de la migración 014 consulta
-- group_athletes, y la política de group_athletes consulta groups. Postgres
-- detecta el ciclo y aborta CUALQUIER lectura de grupos:
--
--   ERROR: 42P17: infinite recursion detected in policy for relation "groups"
--
-- No afectaba solo al atleta: rompía la tabla para todos los roles.
--
-- Se corta el ciclo con una función SECURITY DEFINER. Al ejecutarse con los
-- permisos de su dueño, la consulta interna no vuelve a evaluar RLS, y la
-- cadena termina.

CREATE OR REPLACE FUNCTION atleta_esta_en_grupo(p_group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM group_athletes ga
    JOIN athletes a ON a.id = ga.athlete_id
    WHERE ga.group_id = p_group_id
      AND a.user_id = get_public_user_id()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

DROP POLICY IF EXISTS "groups_athlete_propios" ON groups;

CREATE POLICY "groups_athlete_propios" ON groups FOR SELECT
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'athlete'
         AND atleta_esta_en_grupo(groups.id));
