-- ─────────────────────────────────────────────────────────────────────────────
-- Cruces de datos que sobrevivieron a la migración 014
-- ─────────────────────────────────────────────────────────────────────────────
--
-- La 014 acotó rutinas, WODs, grupos y asignaciones, pero quedaron tres vías
-- abiertas. En el panel se veían como atletas y sesiones de otros coaches
-- dentro de las métricas propias: "Atletas en riesgo" listaba gente que no
-- existe para ese coach.
--
-- Las tres tenían el mismo defecto de fondo: comprobaban el ROL pero no la
-- PERTENENCIA. Da igual cuántas políticas estrictas se agreguen si queda una
-- que dice "eres coach, pasa".

-- ─── 1. La vista de cumplimiento saltaba RLS por completo ───────────────────
--
-- En Postgres una vista se ejecuta con los permisos de SU DUEÑO, no de quien
-- consulta, salvo que se marque con security_invoker. athlete_compliance no lo
-- tenía. Y su definición no filtra por coach ni por gimnasio: se apoyaba en las
-- políticas de athletes, que nunca llegaban a evaluarse.
--
-- Es el agujero más silencioso de los tres, porque la tabla estaba bien
-- protegida y aun así los datos salían.

ALTER VIEW public.athlete_compliance SET (security_invoker = on);

-- ─── 2. Sesiones de entrenamiento ───────────────────────────────────────────
-- Antes: USING (tenant_id = get_tenant_id() AND get_user_role() = 'coach')
-- Cualquier coach del box alcanzaba las sesiones de todos.

DROP POLICY IF EXISTS "sessions_coach" ON training_sessions;

CREATE POLICY "sessions_coach" ON training_sessions FOR ALL
  USING (
    tenant_id = get_tenant_id() AND get_user_role() = 'coach'
    AND EXISTS (
      SELECT 1 FROM athletes a
      WHERE a.id = training_sessions.athlete_id
        AND a.assigned_coach_id = get_public_user_id()
    )
  );

-- ─── 3. Comentarios ─────────────────────────────────────────────────────────
-- Antes: rol IN ('coach','super_admin') sin mirar sobre quién es el comentario.
-- Un comentario cuelga de un atleta o de un grupo: el coach alcanza los de sus
-- atletas, los de sus grupos y los que escribió él.

DROP POLICY IF EXISTS "comments_staff" ON comments;

CREATE POLICY "comments_admin" ON comments FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'super_admin');

CREATE POLICY "comments_coach" ON comments FOR ALL
  USING (
    tenant_id = get_tenant_id() AND get_user_role() = 'coach'
    AND (
      author_id = get_public_user_id()
      OR (entity_type = 'athlete' AND EXISTS (
            SELECT 1 FROM athletes a
            WHERE a.id = comments.entity_id
              AND a.assigned_coach_id = get_public_user_id()))
      OR (entity_type = 'group' AND EXISTS (
            SELECT 1 FROM groups g
            WHERE g.id = comments.entity_id
              AND g.coach_id = get_public_user_id()))
    )
  );

-- ─── Cómo buscar el próximo ─────────────────────────────────────────────────
-- Estas dos consultas encuentran la clase completa de problema. Vale la pena
-- correrlas antes de dar por cerrado cualquier tema de aislamiento:
--
--   -- Políticas que miran el rol pero no la pertenencia
--   SELECT tablename, policyname, qual FROM pg_policies
--   WHERE schemaname='public' AND qual LIKE '%coach%'
--     AND qual NOT LIKE '%get_public_user_id%' AND qual NOT LIKE '%assigned_coach_id%'
--     AND qual NOT LIKE '%created_by%' AND qual NOT LIKE '%invited_by%'
--     AND qual NOT LIKE '%coach_id%';
--
--   -- Vistas que se saltan RLS, y tablas sin RLS
--   SELECT c.relname, c.relkind, c.relrowsecurity, c.reloptions
--   FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE n.nspname='public' AND c.relkind IN ('r','v');
