-- Migration 010: que borrar bloques o ejercicios no rompa ni destruya historial
--
-- Mismo criterio que la 009: session_logs y set_logs son el registro de lo que
-- el atleta efectivamente levanto, asi que nunca se borran en cascada. Se
-- conserva la fila y solo se pierde el enlace.
--
-- El caso 1 era un fallo activo: deleteBlock() borra routine_blocks de verdad,
-- eso cascadea a routine_exercises, y esta FK lo bloqueaba. Reproducido:
--   "update or delete on table routine_exercises violates foreign key
--    constraint session_logs_routine_exercise_id_fkey"

ALTER TABLE session_logs
  DROP CONSTRAINT session_logs_routine_exercise_id_fkey,
  ADD  CONSTRAINT session_logs_routine_exercise_id_fkey
       FOREIGN KEY (routine_exercise_id) REFERENCES routine_exercises(id) ON DELETE SET NULL;

ALTER TABLE session_logs
  DROP CONSTRAINT session_logs_exercise_id_fkey,
  ADD  CONSTRAINT session_logs_exercise_id_fkey
       FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL;

-- wod_movements guarda `name` como texto, asi que el movimiento sigue siendo
-- legible aunque el ejercicio de la biblioteca desaparezca.
ALTER TABLE wod_movements
  DROP CONSTRAINT wod_movements_exercise_id_fkey,
  ADD  CONSTRAINT wod_movements_exercise_id_fkey
       FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Se dejan a proposito en NO ACTION, tras revisar las 23 FK del esquema:
--
--   routine_exercises.exercise_id  es NOT NULL, asi que SET NULL no aplica y
--     CASCADE mutaria rutinas en silencio. NO ACTION actua de guarda: no deja
--     borrar un ejercicio que este prescrito en alguna rutina.
--   *.athlete_id, *.created_by, *.coach_id, *.user_id, *.tenant_id
--     Sus tablas padre nunca se borran de verdad (atletas, rutinas, WODs y
--     comentarios usan borrado suave; los usuarios se desactivan). Ahi NO ACTION
--     funciona como red de seguridad y no como bug.
