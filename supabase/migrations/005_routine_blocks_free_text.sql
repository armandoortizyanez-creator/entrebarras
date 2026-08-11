-- Migration 005: bloques de rutina como texto libre ("cuaderno blanco")
--
-- El coach escribe o pega el contenido del bloque directamente, en vez de
-- cargarlo ejercicio por ejercicio. `links` guarda las referencias en video
-- del bloque como array de objetos {label, url}.

ALTER TABLE routine_blocks
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS links   JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN routine_blocks.content IS
  'Contenido libre del bloque escrito por el coach. Se preserva el salto de linea.';
COMMENT ON COLUMN routine_blocks.links IS
  'Referencias del bloque: array de objetos {label, url}.';
