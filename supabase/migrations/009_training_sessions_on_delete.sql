-- Migration 009: que borrar una rutina, WOD o grupo no rompa ni destruya historial
--
-- training_sessions.routine_id / wod_id / group_id estaban en NO ACTION, asi
-- que borrar cualquiera de esas tres cosas fallaba con violacion de clave
-- foranea si tenia sesiones asociadas. La de grupos era la mas expuesta: los
-- grupos si se borran de verdad desde la app, no con borrado suave.
--
-- Se usa SET NULL y NO CASCADE a proposito. session_logs cascadea desde
-- training_sessions, y set_logs desde session_logs:
--
--   routine -> training_sessions -> session_logs -> set_logs
--
-- Un CASCADE aqui borraria en cadena todas las series, pesos y PRs que el
-- atleta registro entrenando esa rutina. SET NULL conserva el historial y solo
-- pierde el enlace, que es lo que ya hace box_schedule en este mismo esquema.

ALTER TABLE training_sessions
  DROP CONSTRAINT training_sessions_routine_id_fkey,
  ADD  CONSTRAINT training_sessions_routine_id_fkey
       FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE SET NULL;

ALTER TABLE training_sessions
  DROP CONSTRAINT training_sessions_wod_id_fkey,
  ADD  CONSTRAINT training_sessions_wod_id_fkey
       FOREIGN KEY (wod_id) REFERENCES wods(id) ON DELETE SET NULL;

ALTER TABLE training_sessions
  DROP CONSTRAINT training_sessions_group_id_fkey,
  ADD  CONSTRAINT training_sessions_group_id_fkey
       FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;
