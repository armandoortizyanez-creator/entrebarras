-- ─────────────────────────────────────────────────────────────────────────────
-- El atleta no veía el nombre de las rutinas programadas por fecha
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Hay dos caminos para que una rutina llegue a un atleta, y son independientes:
--
--   a) asignársela directo       -> fila en athlete_routines
--   b) programarla en una fecha  -> fila en training_sessions
--
-- La política de lectura solo contemplaba (a). El resultado en la agenda era
-- una tarjeta con la fecha correcta pero el nombre en blanco, que caía al texto
-- de reserva "Entrenamiento": la sesión se veía, la rutina detrás no.

DROP POLICY IF EXISTS "routines_athlete_programadas" ON routines;

CREATE POLICY "routines_athlete_programadas" ON routines FOR SELECT
  USING (
    tenant_id = get_tenant_id() AND get_user_role() = 'athlete'
    AND EXISTS (
      SELECT 1 FROM training_sessions s
      JOIN athletes a ON a.id = s.athlete_id
      WHERE s.routine_id = routines.id
        AND a.user_id = get_public_user_id()
    )
  );
