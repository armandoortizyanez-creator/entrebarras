-- ─────────────────────────────────────────────────────────────────────────────
-- Las marcas personales eran de lectura y escritura para todo el gimnasio
-- ─────────────────────────────────────────────────────────────────────────────
--
-- personal_records quedó desde 011 con la política más permisiva posible:
--
--   CREATE POLICY tenant_isolation ON personal_records
--     FOR ALL TO authenticated USING (tenant_id = get_tenant_id());
--
-- FOR ALL y sin WITH CHECK: cualquier atleta del box podía leer los pesos de
-- todos los demás, editarlos y borrarlos. No es un hueco teórico —hoy hay 10
-- marcas reales cargadas por un atleta— y cuánto levanta cada uno es
-- exactamente el dato que nadie quiere que ande circulando por el gimnasio.
--
-- Se corrige ANTES de meter los PRs dentro de la rutina. Esa pantalla convierte
-- la tabla en la herramienta de todos los días: construir encima de la política
-- vieja habría multiplicado la fuga en vez de cerrarla. Mismo razonamiento y
-- misma forma que 028 con session_logs.
--
-- Se aprovecha de cerrar los otros dos agujeros idénticos (wod_results y
-- set_logs, ambos con 0 filas hoy), para no dejar la misma trampa esperando a
-- que alguien empiece a usarlas.
--
-- Criterio de siempre: cada quien lo suyo, el coach lo de sus atletas
-- asignados, el admin lo del box.

-- ─── personal_records ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "tenant_isolation" ON personal_records;

CREATE POLICY "prs_platform_admin" ON personal_records FOR ALL
  USING (is_platform_admin()) WITH CHECK (is_platform_admin());

CREATE POLICY "prs_admin" ON personal_records FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'super_admin')
  WITH CHECK (tenant_id = get_tenant_id() AND get_user_role() = 'super_admin');

-- El coach también escribe: desde "Mis PRs" puede elegir un atleta y
-- registrarle una marca, así que necesita ALL y no solo lectura.
CREATE POLICY "prs_coach" ON personal_records FOR ALL
  USING (
    tenant_id = get_tenant_id() AND get_user_role() = 'coach'
    AND EXISTS (SELECT 1 FROM athletes a
                WHERE a.id = personal_records.athlete_id
                  AND a.assigned_coach_id = get_public_user_id())
  )
  WITH CHECK (
    tenant_id = get_tenant_id() AND get_user_role() = 'coach'
    AND EXISTS (SELECT 1 FROM athletes a
                WHERE a.id = personal_records.athlete_id
                  AND a.assigned_coach_id = get_public_user_id())
  );

-- El WITH CHECK es lo que impide inventar marcas en la ficha de otro: sin él,
-- un UPDATE podía mover la fila a otro athlete_id.
CREATE POLICY "prs_athlete" ON personal_records FOR ALL
  USING (
    tenant_id = get_tenant_id() AND get_user_role() = 'athlete'
    AND EXISTS (SELECT 1 FROM athletes a
                WHERE a.id = personal_records.athlete_id
                  AND a.user_id = get_public_user_id())
  )
  WITH CHECK (
    tenant_id = get_tenant_id() AND get_user_role() = 'athlete'
    AND EXISTS (SELECT 1 FROM athletes a
                WHERE a.id = personal_records.athlete_id
                  AND a.user_id = get_public_user_id())
  );

-- ─── wod_results ─────────────────────────────────────────────────────────────
--
-- athlete_id es nullable (ON DELETE SET NULL, para no romper el historial del
-- WOD cuando se elimina un atleta). Esas filas huérfanas quedan visibles solo
-- para el admin del box, que es quien puede hacer algo con ellas.

DROP POLICY IF EXISTS "tenant_isolation" ON wod_results;

CREATE POLICY "wres_platform_admin" ON wod_results FOR ALL
  USING (is_platform_admin()) WITH CHECK (is_platform_admin());

CREATE POLICY "wres_admin" ON wod_results FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'super_admin')
  WITH CHECK (tenant_id = get_tenant_id() AND get_user_role() = 'super_admin');

CREATE POLICY "wres_coach" ON wod_results FOR ALL
  USING (
    tenant_id = get_tenant_id() AND get_user_role() = 'coach'
    AND EXISTS (SELECT 1 FROM athletes a
                WHERE a.id = wod_results.athlete_id
                  AND a.assigned_coach_id = get_public_user_id())
  )
  WITH CHECK (
    tenant_id = get_tenant_id() AND get_user_role() = 'coach'
    AND EXISTS (SELECT 1 FROM athletes a
                WHERE a.id = wod_results.athlete_id
                  AND a.assigned_coach_id = get_public_user_id())
  );

CREATE POLICY "wres_athlete" ON wod_results FOR ALL
  USING (
    tenant_id = get_tenant_id() AND get_user_role() = 'athlete'
    AND EXISTS (SELECT 1 FROM athletes a
                WHERE a.id = wod_results.athlete_id
                  AND a.user_id = get_public_user_id())
  )
  WITH CHECK (
    tenant_id = get_tenant_id() AND get_user_role() = 'athlete'
    AND EXISTS (SELECT 1 FROM athletes a
                WHERE a.id = wod_results.athlete_id
                  AND a.user_id = get_public_user_id())
  );

-- ─── set_logs ────────────────────────────────────────────────────────────────
--
-- Cuelga de session_logs, que 028 ya acotó. Su política seguía saltándose ese
-- filtro yendo directo a training_sessions por tenant_id, así que el peso de
-- cada serie quedaba a la vista de todo el box.

DROP POLICY IF EXISTS "setlogs_tenant" ON set_logs;

CREATE POLICY "setlogs_admin" ON set_logs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM session_logs sl
    JOIN training_sessions s ON s.id = sl.session_id
    WHERE sl.id = set_logs.session_log_id
      AND s.tenant_id = get_tenant_id()
      AND get_user_role() = 'super_admin'
  ));

CREATE POLICY "setlogs_coach" ON set_logs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM session_logs sl
    JOIN training_sessions s ON s.id = sl.session_id
    JOIN athletes a ON a.id = s.athlete_id
    WHERE sl.id = set_logs.session_log_id
      AND s.tenant_id = get_tenant_id()
      AND get_user_role() = 'coach'
      AND a.assigned_coach_id = get_public_user_id()
  ));

CREATE POLICY "setlogs_athlete" ON set_logs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM session_logs sl
    JOIN training_sessions s ON s.id = sl.session_id
    JOIN athletes a ON a.id = s.athlete_id
    WHERE sl.id = set_logs.session_log_id
      AND s.tenant_id = get_tenant_id()
      AND get_user_role() = 'athlete'
      AND a.user_id = get_public_user_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM session_logs sl
    JOIN training_sessions s ON s.id = sl.session_id
    JOIN athletes a ON a.id = s.athlete_id
    WHERE sl.id = set_logs.session_log_id
      AND s.tenant_id = get_tenant_id()
      AND get_user_role() = 'athlete'
      AND a.user_id = get_public_user_id()
  ));

-- setlogs_platform_admin ya existía y se mantiene.
