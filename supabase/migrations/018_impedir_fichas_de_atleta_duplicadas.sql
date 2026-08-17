-- ─────────────────────────────────────────────────────────────────────────────
-- Última línea de defensa contra las fichas de atleta duplicadas
-- ─────────────────────────────────────────────────────────────────────────────
--
-- La 017 arregló el trigger que vincula al registrarse, y la app ahora avisa
-- cuando un coach intenta crear un atleta con un correo que ya existe. Aun así
-- ninguna de las dos cosas impide que un camino nuevo —una importación, un
-- script, un cambio futuro— vuelva a insertar dos fichas con el mismo correo
-- en el mismo box. Acá la base lo rechaza sin importar por dónde venga.
--
-- Vale la pena el cinturón: mientras existió el duplicado, el coach asignaba
-- rutinas a una ficha y el atleta entraba con la otra. No fallaba nada visible,
-- simplemente no aparecía el entrenamiento, y eso costó tres reportes antes de
-- encontrarlo.
--
-- La normalización es la misma del trigger, porque por ahí se coló el caso
-- real: "Shey.almedo@gmail.com" contra "shey.almedo@gmail.com".
--
-- Las fichas sin correo quedan fuera del índice a propósito: un coach puede
-- tener varios atletas sin correo cargado y eso es legítimo.
--
-- Las eliminadas también quedan fuera. La primera versión de este índice no las
-- excluía, y el efecto fue peor que el problema: un coach que eliminaba a un
-- atleta no podía volver a crearlo con el mismo correo nunca más, porque la
-- base lo rechazaba contra un registro que ya no existe para nadie. Eso mismo
-- llevó a crear una ficha paralela y a perder las asignaciones.

CREATE UNIQUE INDEX IF NOT EXISTS athletes_correo_unico_por_box
  ON athletes (tenant_id, lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '' AND deleted_at IS NULL;

-- ─── Fusión de los duplicados que quedaban ──────────────────────────────────
-- Se dejó constancia acá de la reparación manual: la ficha "Felipe  Muñoz",
-- creada sin correo 45 segundos antes de que Felipe se registrara, se fusionó
-- con la suya por decisión explícita del usuario (el correo no permitía
-- resolverlo solo). Las fichas sueltas que quedaron vacías se eliminaron.
--
-- No se repite el SQL porque ya se ejecutó sobre datos concretos y volver a
-- correrlo no aplicaría a ninguna base nueva.
