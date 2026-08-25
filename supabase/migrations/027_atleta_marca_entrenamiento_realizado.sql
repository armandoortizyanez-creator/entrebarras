-- ─────────────────────────────────────────────────────────────────────────────
-- El atleta puede marcar un entrenamiento como realizado
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Todo el andamiaje ya existía: training_sessions tiene status y completed_at,
-- y la vista athlete_compliance —la que alimenta "Atletas en riesgo" y el
-- cumplimiento del coach— ya calcula sobre esas dos columnas. Lo único que
-- faltaba era que el atleta pudiera escribir ahí.
--
-- Una rutina le llega por dos caminos independientes:
--   asignada    (athlete_routines)   sin fecha
--   programada  (training_sessions)  con fecha
--
-- Si estaba solo asignada no existía ninguna fila que marcar, así que el
-- atleta no tenía cómo registrar que entrenó. Ahora puede crear el registro
-- con la fecha de hoy, y con eso aparece en su calendario, en su programación
-- y en el cumplimiento que ve el coach.

-- ─── 1. Registrar su propio entrenamiento ───────────────────────────────────
-- El WITH CHECK lo limita a SU ficha: no puede inventar sesiones de otro
-- atleta ni de otro gimnasio.

DROP POLICY IF EXISTS "sessions_athlete_insert" ON training_sessions;

CREATE POLICY "sessions_athlete_insert" ON training_sessions FOR INSERT
  WITH CHECK (
    tenant_id = get_tenant_id()
    AND get_user_role() = 'athlete'
    AND EXISTS (
      SELECT 1 FROM athletes a
      WHERE a.id = training_sessions.athlete_id
        AND a.user_id = get_public_user_id()
    )
  );

-- ─── 2. La política de UPDATE no tenía WITH CHECK ───────────────────────────
-- Con solo USING, un UPDATE puede dejar la fila en un estado que la propia
-- política ya no permitiría leer. Se agrega para que siga siendo suya después
-- de escribirla.

DROP POLICY IF EXISTS "sessions_athlete_update" ON training_sessions;

CREATE POLICY "sessions_athlete_update" ON training_sessions FOR UPDATE
  USING (
    tenant_id = get_tenant_id() AND get_user_role() = 'athlete'
    AND athlete_id IN (SELECT id FROM athletes WHERE user_id = get_public_user_id())
  )
  WITH CHECK (
    tenant_id = get_tenant_id() AND get_user_role() = 'athlete'
    AND athlete_id IN (SELECT id FROM athletes WHERE user_id = get_public_user_id())
  );

-- ─── 3. Deshacer ────────────────────────────────────────────────────────────
--
-- Deshacer un "realizado" que el propio atleta registró implica borrar la
-- fila: dejarla como 'scheduled' inventaría un entrenamiento que ningún coach
-- mandó. No había política de DELETE para el atleta.
--
-- El síntoma era del peor tipo, y solo apareció al probarlo: PostgREST
-- devolvía 204 y la fila seguía ahí. RLS no rechaza el borrado, simplemente no
-- encuentra filas que borrar, y el cliente lo lee como éxito. "Deshacer" no
-- habría hecho nada, sin mostrar ningún error.
--
-- La condición coach_id IS NULL es la que protege lo que mandó el coach: eso
-- solo se puede devolver a 'scheduled' con un UPDATE, nunca borrar. Por eso el
-- registro que crea el atleta se guarda SIN coach_id, aunque tenga coach
-- asignado: ese vacío es el discriminante.

DROP POLICY IF EXISTS "sessions_athlete_delete" ON training_sessions;

CREATE POLICY "sessions_athlete_delete" ON training_sessions FOR DELETE
  USING (
    tenant_id = get_tenant_id()
    AND get_user_role() = 'athlete'
    AND coach_id IS NULL
    AND EXISTS (
      SELECT 1 FROM athletes a
      WHERE a.id = training_sessions.athlete_id
        AND a.user_id = get_public_user_id()
    )
  );
