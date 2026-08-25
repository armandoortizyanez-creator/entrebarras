-- ─────────────────────────────────────────────────────────────────────────────
-- Los registros de sesión eran legibles y editables por todo el gimnasio
-- ─────────────────────────────────────────────────────────────────────────────
--
-- slogs_tenant era FOR ALL con la sola condición de pertenecer al box:
--
--   USING (session_id IN (SELECT id FROM training_sessions
--                         WHERE tenant_id = get_tenant_id()))
--
-- Cualquier atleta podía leer —y escribir— los registros de todos los demás.
--
-- Se corrige ANTES de empezar a usar la tabla. Acá van a quedar las notas
-- personales y cómo se sintió cada uno después de entrenar, que es justo el
-- tipo de dato que no debe ver el resto del gimnasio. Construir la función
-- encima de la política vieja habría convertido un hueco latente en una fuga
-- real de información personal.
--
-- Mismo criterio que el resto de la plataforma: cada quien lo suyo, el coach lo
-- de sus atletas asignados, el admin lo del box.

DROP POLICY IF EXISTS "slogs_tenant" ON session_logs;

CREATE POLICY "slogs_admin" ON session_logs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM training_sessions s
    WHERE s.id = session_logs.session_id
      AND s.tenant_id = get_tenant_id()
      AND get_user_role() = 'super_admin'
  ));

CREATE POLICY "slogs_coach" ON session_logs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM training_sessions s
    JOIN athletes a ON a.id = s.athlete_id
    WHERE s.id = session_logs.session_id
      AND s.tenant_id = get_tenant_id()
      AND get_user_role() = 'coach'
      AND a.assigned_coach_id = get_public_user_id()
  ));

CREATE POLICY "slogs_athlete" ON session_logs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM training_sessions s
    JOIN athletes a ON a.id = s.athlete_id
    WHERE s.id = session_logs.session_id
      AND s.tenant_id = get_tenant_id()
      AND get_user_role() = 'athlete'
      AND a.user_id = get_public_user_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM training_sessions s
    JOIN athletes a ON a.id = s.athlete_id
    WHERE s.id = session_logs.session_id
      AND s.tenant_id = get_tenant_id()
      AND get_user_role() = 'athlete'
      AND a.user_id = get_public_user_id()
  ));

-- slogs_platform_admin ya existía y se mantiene.
