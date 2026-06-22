-- ============================================
-- ENTRE BARRAS — Schema v2
-- Roles: platform_admin / super_admin / coach / athlete
-- ============================================

-- ── 1. HELPER: platform admin bypasses all tenant scoping ──
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── 2. RENAME role 'owner' → 'super_admin' ──
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin', 'coach', 'athlete'));

UPDATE users SET role = 'super_admin' WHERE role = 'owner';

-- Update get_user_role to keep backward compat if needed
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role';
$$ LANGUAGE sql STABLE;

-- ── 3. INVITATIONS table ──
CREATE TABLE IF NOT EXISTS invitations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invited_by    UUID NOT NULL REFERENCES users(id),
  email         TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('super_admin', 'coach', 'athlete')),
  token         TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_tenant  ON invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token   ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email   ON invitations(email, tenant_id);

-- ── 4. GROUPS: add schedule & capacity columns ──
ALTER TABLE groups ADD COLUMN IF NOT EXISTS description   TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS day_of_week   INTEGER[] DEFAULT '{}';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS start_time    TIME;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS end_time      TIME;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS max_capacity  INTEGER;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_global     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS sport         TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT NOW();

-- ── 5. COACH: add hourly_sessions flag ──
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS hourly_sessions BOOLEAN DEFAULT false;

-- ── 6. RLS — ENABLE on new table ──
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ── 7. RLS POLICIES — add platform_admin bypass to all tables ──

-- TENANTS
DROP POLICY IF EXISTS "tenant_self"             ON tenants;
DROP POLICY IF EXISTS "tenant_owner_update"     ON tenants;
DROP POLICY IF EXISTS "tenant_super_admin_update" ON tenants;
DROP POLICY IF EXISTS "tenants_platform_admin"  ON tenants;

CREATE POLICY "tenants_platform_admin"    ON tenants FOR ALL USING (is_platform_admin());
CREATE POLICY "tenant_self"               ON tenants FOR SELECT USING (id = get_tenant_id());
CREATE POLICY "tenant_super_admin_update" ON tenants FOR UPDATE
  USING (id = get_tenant_id() AND get_user_role() = 'super_admin');

-- USERS
DROP POLICY IF EXISTS "users_same_tenant"    ON users;
DROP POLICY IF EXISTS "users_owner_manage"   ON users;
DROP POLICY IF EXISTS "users_platform_admin" ON users;
DROP POLICY IF EXISTS "users_super_admin_manage" ON users;

CREATE POLICY "users_platform_admin"      ON users FOR ALL USING (is_platform_admin());
CREATE POLICY "users_same_tenant"         ON users FOR SELECT USING (tenant_id = get_tenant_id());
CREATE POLICY "users_super_admin_manage"  ON users FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'super_admin');
CREATE POLICY "users_self_update"         ON users FOR UPDATE
  USING (auth_user_id = auth.uid());

-- ATHLETES
DROP POLICY IF EXISTS "athletes_owner"              ON athletes;
DROP POLICY IF EXISTS "athletes_platform_admin"     ON athletes;
DROP POLICY IF EXISTS "athletes_super_admin"        ON athletes;
DROP POLICY IF EXISTS "athletes_coach_assigned"     ON athletes;
DROP POLICY IF EXISTS "athletes_self"               ON athletes;
DROP POLICY IF EXISTS "athletes_self_update"        ON athletes;

CREATE POLICY "athletes_platform_admin"   ON athletes FOR ALL USING (is_platform_admin());
CREATE POLICY "athletes_super_admin"      ON athletes FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'super_admin');
CREATE POLICY "athletes_coach_assigned"   ON athletes FOR SELECT
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'coach' AND assigned_coach_id = auth.uid());
CREATE POLICY "athletes_coach_manage"     ON athletes FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'coach' AND assigned_coach_id = auth.uid());
CREATE POLICY "athletes_self"             ON athletes FOR SELECT
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'athlete' AND user_id = auth.uid());
CREATE POLICY "athletes_self_update"      ON athletes FOR UPDATE
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'athlete' AND user_id = auth.uid());

-- COACHES
DROP POLICY IF EXISTS "coaches_platform_admin" ON coaches;
CREATE POLICY "coaches_platform_admin"    ON coaches FOR ALL USING (is_platform_admin());
CREATE POLICY "coaches_tenant_read"       ON coaches FOR SELECT USING (tenant_id = get_tenant_id());
CREATE POLICY "coaches_super_admin"       ON coaches FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'super_admin');
CREATE POLICY "coaches_self"              ON coaches FOR UPDATE
  USING (tenant_id = get_tenant_id() AND user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  ));

-- GROUPS
DROP POLICY IF EXISTS "groups_platform_admin" ON groups;
CREATE POLICY "groups_platform_admin"     ON groups FOR ALL USING (is_platform_admin());
CREATE POLICY "groups_tenant_read"        ON groups FOR SELECT USING (tenant_id = get_tenant_id());
CREATE POLICY "groups_super_admin"        ON groups FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'super_admin');
CREATE POLICY "groups_coach_manage"       ON groups FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'coach' AND coach_id = auth.uid());

-- GROUP_ATHLETES
DROP POLICY IF EXISTS "group_athletes_platform_admin" ON group_athletes;
CREATE POLICY "group_athletes_platform_admin" ON group_athletes FOR ALL USING (is_platform_admin());
CREATE POLICY "group_athletes_tenant_read"    ON group_athletes FOR SELECT
  USING (group_id IN (SELECT id FROM groups WHERE tenant_id = get_tenant_id()));
CREATE POLICY "group_athletes_super_admin"    ON group_athletes FOR ALL
  USING (group_id IN (SELECT id FROM groups WHERE tenant_id = get_tenant_id())
         AND get_user_role() = 'super_admin');
CREATE POLICY "group_athletes_coach"          ON group_athletes FOR ALL
  USING (group_id IN (SELECT id FROM groups WHERE coach_id = auth.uid() AND tenant_id = get_tenant_id()));

-- EXERCISES (no change needed, but add platform_admin)
DROP POLICY IF EXISTS "exercises_platform_admin" ON exercises;
CREATE POLICY "exercises_platform_admin" ON exercises FOR ALL USING (is_platform_admin());

-- ROUTINES
DROP POLICY IF EXISTS "routines_platform_admin" ON routines;
DROP POLICY IF EXISTS "routines_tenant"          ON routines;
CREATE POLICY "routines_platform_admin" ON routines FOR ALL USING (is_platform_admin());
CREATE POLICY "routines_tenant"         ON routines FOR ALL USING (tenant_id = get_tenant_id());

-- WODs
DROP POLICY IF EXISTS "wods_platform_admin" ON wods;
DROP POLICY IF EXISTS "wods_tenant"          ON wods;
CREATE POLICY "wods_platform_admin" ON wods FOR ALL USING (is_platform_admin());
CREATE POLICY "wods_tenant"         ON wods FOR ALL USING (tenant_id = get_tenant_id());

-- TRAINING SESSIONS
DROP POLICY IF EXISTS "sessions_owner_coach"    ON training_sessions;
DROP POLICY IF EXISTS "sessions_platform_admin" ON training_sessions;
DROP POLICY IF EXISTS "sessions_athlete_self"   ON training_sessions;
CREATE POLICY "sessions_platform_admin"  ON training_sessions FOR ALL USING (is_platform_admin());
CREATE POLICY "sessions_super_admin"     ON training_sessions FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'super_admin');
CREATE POLICY "sessions_coach"           ON training_sessions FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'coach');
CREATE POLICY "sessions_athlete_self"    ON training_sessions FOR SELECT
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'athlete'
    AND athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

-- SESSION LOGS
DROP POLICY IF EXISTS "slogs_tenant"          ON session_logs;
DROP POLICY IF EXISTS "slogs_platform_admin"  ON session_logs;
CREATE POLICY "slogs_platform_admin" ON session_logs FOR ALL USING (is_platform_admin());
CREATE POLICY "slogs_tenant"         ON session_logs FOR ALL
  USING (session_id IN (SELECT id FROM training_sessions WHERE tenant_id = get_tenant_id()));

-- SET LOGS (inherit from session_logs via session)
ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "setlogs_platform_admin" ON set_logs;
CREATE POLICY "setlogs_platform_admin" ON set_logs FOR ALL USING (is_platform_admin());
CREATE POLICY "setlogs_tenant"         ON set_logs FOR ALL
  USING (session_log_id IN (
    SELECT sl.id FROM session_logs sl
    JOIN training_sessions ts ON ts.id = sl.session_id
    WHERE ts.tenant_id = get_tenant_id()
  ));

-- BODY MEASUREMENTS
DROP POLICY IF EXISTS "measurements_owner_coach"    ON body_measurements;
DROP POLICY IF EXISTS "measurements_athlete_self"   ON body_measurements;
DROP POLICY IF EXISTS "measurements_platform_admin" ON body_measurements;
CREATE POLICY "measurements_platform_admin" ON body_measurements FOR ALL USING (is_platform_admin());
CREATE POLICY "measurements_super_admin"    ON body_measurements FOR ALL
  USING (athlete_id IN (SELECT id FROM athletes WHERE tenant_id = get_tenant_id())
         AND get_user_role() = 'super_admin');
CREATE POLICY "measurements_coach"          ON body_measurements FOR ALL
  USING (athlete_id IN (SELECT id FROM athletes
    WHERE tenant_id = get_tenant_id() AND assigned_coach_id = auth.uid())
    AND get_user_role() = 'coach');
CREATE POLICY "measurements_athlete_self"   ON body_measurements FOR ALL
  USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "subscriptions_owner"          ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_platform_admin" ON subscriptions;
CREATE POLICY "subscriptions_platform_admin" ON subscriptions FOR ALL USING (is_platform_admin());
CREATE POLICY "subscriptions_super_admin"    ON subscriptions FOR SELECT
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'super_admin');

-- AUDIT LOGS
DROP POLICY IF EXISTS "audit_platform_admin" ON audit_logs;
CREATE POLICY "audit_platform_admin" ON audit_logs FOR ALL USING (is_platform_admin());
CREATE POLICY "audit_super_admin"    ON audit_logs FOR SELECT
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'super_admin');

-- INVITATIONS
CREATE POLICY "invitations_platform_admin" ON invitations FOR ALL USING (is_platform_admin());
CREATE POLICY "invitations_super_admin"    ON invitations FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'super_admin');
CREATE POLICY "invitations_coach_create"   ON invitations FOR INSERT
  WITH CHECK (tenant_id = get_tenant_id() AND get_user_role() = 'coach' AND role = 'athlete');
CREATE POLICY "invitations_coach_read"     ON invitations FOR SELECT
  USING (tenant_id = get_tenant_id() AND get_user_role() = 'coach'
    AND invited_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- ── 8. ROUTINE_BLOCKS & ROUTINE_EXERCISES: inherit via tenant ──
ALTER TABLE routine_blocks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE wod_movements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE wod_scaled        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rblocks_platform_admin" ON routine_blocks;
CREATE POLICY "rblocks_platform_admin" ON routine_blocks FOR ALL USING (is_platform_admin());
CREATE POLICY "rblocks_tenant"         ON routine_blocks FOR ALL
  USING (routine_id IN (SELECT id FROM routines WHERE tenant_id = get_tenant_id()));

DROP POLICY IF EXISTS "rex_platform_admin" ON routine_exercises;
CREATE POLICY "rex_platform_admin" ON routine_exercises FOR ALL USING (is_platform_admin());
CREATE POLICY "rex_tenant"         ON routine_exercises FOR ALL
  USING (block_id IN (
    SELECT rb.id FROM routine_blocks rb
    JOIN routines r ON r.id = rb.routine_id
    WHERE r.tenant_id = get_tenant_id()
  ));

DROP POLICY IF EXISTS "wod_movements_platform_admin" ON wod_movements;
CREATE POLICY "wod_movements_platform_admin" ON wod_movements FOR ALL USING (is_platform_admin());
CREATE POLICY "wod_movements_tenant"         ON wod_movements FOR ALL
  USING (wod_id IN (SELECT id FROM wods WHERE tenant_id = get_tenant_id()));

DROP POLICY IF EXISTS "wod_scaled_platform_admin" ON wod_scaled;
CREATE POLICY "wod_scaled_platform_admin" ON wod_scaled FOR ALL USING (is_platform_admin());
CREATE POLICY "wod_scaled_tenant"         ON wod_scaled FOR ALL
  USING (wod_id IN (SELECT id FROM wods WHERE tenant_id = get_tenant_id()));
