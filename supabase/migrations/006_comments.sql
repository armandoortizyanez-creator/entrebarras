-- Migration 006: comentarios sobre atletas y grupos
--
-- Tabla unica polimorfica: el mismo componente de UI sirve para ambos y deja
-- la puerta abierta a comentar otras entidades mas adelante.
--
-- `visibility` decide quien lo lee:
--   'staff'  -> solo coaches y administradores del box (nota interna)
--   'shared' -> ademas lo ve el atleta comentado, o los integrantes del grupo

CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('athlete','group')),
  entity_id   UUID NOT NULL,
  body        TEXT NOT NULL CHECK (length(btrim(body)) > 0),
  visibility  TEXT NOT NULL DEFAULT 'staff' CHECK (visibility IN ('staff','shared')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS comments_entity_idx
  ON comments (entity_type, entity_id, created_at DESC)
  WHERE deleted_at IS NULL;

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Staff del box: acceso total dentro de su tenant
DROP POLICY IF EXISTS comments_staff ON comments;
CREATE POLICY comments_staff ON comments
  FOR ALL TO authenticated
  USING (
    tenant_id = get_tenant_id()
    AND get_user_role() = ANY (ARRAY['coach','super_admin'])
  )
  WITH CHECK (
    tenant_id = get_tenant_id()
    AND get_user_role() = ANY (ARRAY['coach','super_admin'])
  );

DROP POLICY IF EXISTS comments_platform_admin ON comments;
CREATE POLICY comments_platform_admin ON comments
  FOR ALL TO authenticated
  USING (is_platform_admin());

-- Atleta: solo lectura, solo lo marcado como compartido, y solo lo suyo
DROP POLICY IF EXISTS comments_athlete_read ON comments;
CREATE POLICY comments_athlete_read ON comments
  FOR SELECT TO authenticated
  USING (
    tenant_id = get_tenant_id()
    AND get_user_role() = 'athlete'
    AND visibility = 'shared'
    AND deleted_at IS NULL
    AND (
      -- comentario sobre el propio atleta
      (entity_type = 'athlete' AND EXISTS (
        SELECT 1 FROM athletes a
        WHERE a.id = comments.entity_id
          AND a.user_id = get_public_user_id()
          AND a.deleted_at IS NULL
      ))
      OR
      -- comentario sobre un grupo del que es integrante
      (entity_type = 'group' AND EXISTS (
        SELECT 1 FROM group_athletes ga
        JOIN athletes a ON a.id = ga.athlete_id
        WHERE ga.group_id = comments.entity_id
          AND a.user_id = get_public_user_id()
          AND a.deleted_at IS NULL
      ))
    )
  );
