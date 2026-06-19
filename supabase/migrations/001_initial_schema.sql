-- ============================================
-- ENTRE BARRAS — Schema v1
-- Ejecutar en: Supabase → SQL Editor
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- TENANTS
-- ============================================
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  logo_url      TEXT,
  plan_tier     TEXT NOT NULL DEFAULT 'trial'
                  CHECK (plan_tier IN ('trial','starter','growth','pro')),
  settings      JSONB DEFAULT '{}',
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  auth_user_id  UUID UNIQUE NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('owner','coach','athlete')),
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  avatar_url    TEXT,
  phone         TEXT,
  nationality   TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_tenant    ON users(tenant_id);
CREATE INDEX idx_users_auth      ON users(auth_user_id);
CREATE INDEX idx_users_role      ON users(tenant_id, role);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
CREATE TABLE subscriptions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID UNIQUE NOT NULL REFERENCES tenants(id),
  plan_tier             TEXT NOT NULL DEFAULT 'trial',
  status                TEXT DEFAULT 'trialing'
                          CHECK (status IN ('trialing','active','past_due','canceled')),
  trial_ends_at         TIMESTAMPTZ,
  current_period_start  TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  stripe_customer_id    TEXT,
  stripe_sub_id         TEXT,
  payment_provider      TEXT DEFAULT 'stripe'
                          CHECK (payment_provider IN ('stripe','mercadopago','flow')),
  currency              TEXT DEFAULT 'CLP',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ATHLETES
-- ============================================
CREATE TABLE athletes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES users(id),
  assigned_coach_id UUID REFERENCES users(id),
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  nationality       TEXT,
  avatar_url        TEXT,
  primary_sport     TEXT,
  sport_level       TEXT CHECK (sport_level IN ('beginner','intermediate','advanced','competitive')),
  facility          TEXT,
  gender            TEXT CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  date_of_birth     DATE,
  weight_kg         NUMERIC(5,2),
  height_cm         NUMERIC(5,1),
  blood_type        TEXT,
  injuries          TEXT[] DEFAULT '{}',
  restrictions      TEXT[] DEFAULT '{}',
  medical_notes     TEXT,
  status            TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','prospect')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX idx_athletes_tenant  ON athletes(tenant_id);
CREATE INDEX idx_athletes_coach   ON athletes(assigned_coach_id);
CREATE INDEX idx_athletes_status  ON athletes(tenant_id, status);
CREATE INDEX idx_athletes_search  ON athletes USING gin(
  (first_name || ' ' || last_name) gin_trgm_ops
);

-- ============================================
-- COACHES
-- ============================================
CREATE TABLE coaches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id),
  bio             TEXT,
  specialties     TEXT[] DEFAULT '{}',
  certifications  TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GROUPS (Clases)
-- ============================================
CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT DEFAULT 'class' CHECK (type IN ('class','program','team')),
  coach_id    UUID REFERENCES users(id),
  schedule    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_athletes (
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  athlete_id  UUID REFERENCES athletes(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, athlete_id)
);

CREATE INDEX idx_groups_tenant ON groups(tenant_id);

-- ============================================
-- EXERCISES (global + custom)
-- ============================================
CREATE TABLE exercises (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID REFERENCES tenants(id),  -- NULL = global
  source            TEXT NOT NULL DEFAULT 'custom'
                      CHECK (source IN ('exercisedb','custom')),
  external_id       TEXT,
  name              TEXT NOT NULL,
  description       TEXT,
  instructions      TEXT[] DEFAULT '{}',
  muscle_group      TEXT,
  secondary_muscles TEXT[] DEFAULT '{}',
  equipment         TEXT,
  category          TEXT,
  gif_url           TEXT,
  video_url         TEXT,
  image_url         TEXT,
  is_public         BOOLEAN DEFAULT false,
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exercises_tenant    ON exercises(tenant_id);
CREATE INDEX idx_exercises_source    ON exercises(source);
CREATE INDEX idx_exercises_muscle    ON exercises(muscle_group);
CREATE INDEX idx_exercises_name_trgm ON exercises USING gin(name gin_trgm_ops);

-- ============================================
-- ROUTINES
-- ============================================
CREATE TABLE routines (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  description TEXT,
  type        TEXT CHECK (type IN ('strength','hypertrophy','cardio','crossfit','rehab','general')),
  is_template BOOLEAN DEFAULT false,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE routine_blocks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id  UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  type        TEXT DEFAULT 'standard' CHECK (type IN ('standard','superset','circuit')),
  name        TEXT,
  notes       TEXT
);

CREATE TABLE routine_exercises (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_id        UUID NOT NULL REFERENCES routine_blocks(id) ON DELETE CASCADE,
  exercise_id     UUID NOT NULL REFERENCES exercises(id),
  order_index     INTEGER NOT NULL,
  sets            INTEGER,
  reps            TEXT,
  weight_kg       NUMERIC(6,2),
  time_seconds    INTEGER,
  distance_meters NUMERIC(8,2),
  rest_seconds    INTEGER,
  rpe             INTEGER CHECK (rpe BETWEEN 1 AND 10),
  notes           TEXT
);

CREATE INDEX idx_routines_tenant ON routines(tenant_id);
CREATE INDEX idx_blocks_routine  ON routine_blocks(routine_id);
CREATE INDEX idx_rex_block       ON routine_exercises(block_id);

-- ============================================
-- WODS
-- ============================================
CREATE TABLE wods (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL
                CHECK (type IN ('amrap','emom','for_time','tabata','chipper','intervals','custom')),
  rounds      INTEGER,
  time_cap_s  INTEGER,
  work_s      INTEGER,
  rest_s      INTEGER,
  is_template BOOLEAN DEFAULT false,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE wod_movements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wod_id      UUID NOT NULL REFERENCES wods(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  order_index INTEGER NOT NULL,
  name        TEXT NOT NULL,
  reps        TEXT,
  weight_kg   NUMERIC(6,2),
  distance_m  NUMERIC(8,2),
  calories    INTEGER,
  notes       TEXT
);

CREATE TABLE wod_scaled (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wod_id    UUID NOT NULL REFERENCES wods(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  movements JSONB DEFAULT '[]'
);

CREATE INDEX idx_wods_tenant     ON wods(tenant_id);
CREATE INDEX idx_movements_wod   ON wod_movements(wod_id);

-- ============================================
-- TRAINING SESSIONS
-- ============================================
CREATE TABLE training_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  athlete_id      UUID NOT NULL REFERENCES athletes(id),
  coach_id        UUID REFERENCES users(id),
  routine_id      UUID REFERENCES routines(id),
  wod_id          UUID REFERENCES wods(id),
  group_id        UUID REFERENCES groups(id),
  type            TEXT NOT NULL
                    CHECK (type IN ('routine','wod','rest','event')),
  scheduled_date  DATE NOT NULL,
  scheduled_time  TIME,
  status          TEXT DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled','started','completed','skipped')),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  duration_s      INTEGER,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_athlete     ON training_sessions(athlete_id, scheduled_date);
CREATE INDEX idx_sessions_tenant_date ON training_sessions(tenant_id, scheduled_date);
CREATE INDEX idx_sessions_status      ON training_sessions(tenant_id, status);

-- ============================================
-- SESSION LOGS
-- ============================================
CREATE TABLE session_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  notes       TEXT,
  feeling     INTEGER CHECK (feeling BETWEEN 1 AND 5),
  rpe         INTEGER CHECK (rpe BETWEEN 1 AND 10),
  wod_result  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE set_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_log_id  UUID NOT NULL REFERENCES session_logs(id) ON DELETE CASCADE,
  set_number      INTEGER NOT NULL,
  reps_completed  INTEGER,
  weight_kg       NUMERIC(6,2),
  time_s          INTEGER,
  distance_m      NUMERIC(8,2),
  is_pr           BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_slogs_session ON session_logs(session_id);
CREATE INDEX idx_setlogs_slog  ON set_logs(session_log_id);

-- ============================================
-- BODY MEASUREMENTS
-- ============================================
CREATE TABLE body_measurements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id      UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  measured_at     DATE NOT NULL,
  weight_kg       NUMERIC(5,2),
  height_cm       NUMERIC(5,1),
  body_fat_pct    NUMERIC(4,1),
  muscle_mass_kg  NUMERIC(5,2),
  bmi             NUMERIC(4,1),
  photo_front_url TEXT,
  photo_side_url  TEXT,
  photo_back_url  TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_measurements_athlete ON body_measurements(athlete_id, measured_at);

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  user_id     UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id, created_at);

-- ============================================
-- VIEWS
-- ============================================
CREATE VIEW athlete_compliance AS
SELECT
  a.id                                                        AS athlete_id,
  a.tenant_id,
  a.first_name,
  a.last_name,
  a.assigned_coach_id,
  a.status,
  COUNT(ts.id) FILTER (
    WHERE ts.scheduled_date >= CURRENT_DATE - 7
  )                                                           AS sessions_last_7d,
  COUNT(ts.id) FILTER (
    WHERE ts.status = 'completed'
    AND ts.scheduled_date >= CURRENT_DATE - 30
  )                                                           AS completed_30d,
  COUNT(ts.id) FILTER (
    WHERE ts.scheduled_date >= CURRENT_DATE - 30
  )                                                           AS scheduled_30d,
  MAX(ts.completed_at)                                        AS last_workout_at,
  CURRENT_DATE - MAX(ts.completed_at)::DATE                  AS days_since_last_workout
FROM athletes a
LEFT JOIN training_sessions ts ON ts.athlete_id = a.id
WHERE a.deleted_at IS NULL
GROUP BY a.id, a.tenant_id, a.first_name, a.last_name, a.assigned_coach_id, a.status;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Helper function to get current user's tenant
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role';
$$ LANGUAGE sql STABLE;

-- Enable RLS on all tables
ALTER TABLE tenants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups             ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_athletes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises          ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines           ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_blocks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises  ENABLE ROW LEVEL SECURITY;
ALTER TABLE wods               ENABLE ROW LEVEL SECURITY;
ALTER TABLE wod_movements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wod_scaled         ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;

-- TENANTS: users see their own tenant
CREATE POLICY "tenant_self" ON tenants
  FOR SELECT USING (id = get_tenant_id());

CREATE POLICY "tenant_owner_update" ON tenants
  FOR UPDATE USING (id = get_tenant_id() AND get_user_role() = 'owner');

-- USERS: see users in same tenant
CREATE POLICY "users_same_tenant" ON users
  FOR SELECT USING (tenant_id = get_tenant_id());

CREATE POLICY "users_owner_manage" ON users
  FOR ALL USING (tenant_id = get_tenant_id() AND get_user_role() = 'owner');

-- ATHLETES: owner sees all, coach sees assigned, athlete sees self
CREATE POLICY "athletes_owner" ON athletes
  FOR ALL USING (tenant_id = get_tenant_id() AND get_user_role() = 'owner');

CREATE POLICY "athletes_coach_assigned" ON athletes
  FOR SELECT USING (
    tenant_id = get_tenant_id()
    AND get_user_role() = 'coach'
    AND assigned_coach_id = auth.uid()
  );

CREATE POLICY "athletes_self" ON athletes
  FOR SELECT USING (
    tenant_id = get_tenant_id()
    AND get_user_role() = 'athlete'
    AND user_id = auth.uid()
  );

CREATE POLICY "athletes_self_update" ON athletes
  FOR UPDATE USING (
    tenant_id = get_tenant_id()
    AND get_user_role() = 'athlete'
    AND user_id = auth.uid()
  );

-- EXERCISES: global (tenant_id IS NULL) readable by all, custom by tenant
CREATE POLICY "exercises_global_read" ON exercises
  FOR SELECT USING (tenant_id IS NULL);

CREATE POLICY "exercises_tenant" ON exercises
  FOR ALL USING (tenant_id = get_tenant_id());

-- ROUTINES / WODs: tenant isolation
CREATE POLICY "routines_tenant" ON routines
  FOR ALL USING (tenant_id = get_tenant_id());

CREATE POLICY "wods_tenant" ON wods
  FOR ALL USING (tenant_id = get_tenant_id());

-- SESSIONS: owner/coach see all in tenant, athlete sees own
CREATE POLICY "sessions_owner_coach" ON training_sessions
  FOR ALL USING (
    tenant_id = get_tenant_id()
    AND get_user_role() IN ('owner','coach')
  );

CREATE POLICY "sessions_athlete_self" ON training_sessions
  FOR SELECT USING (
    tenant_id = get_tenant_id()
    AND get_user_role() = 'athlete'
    AND athlete_id IN (
      SELECT id FROM athletes WHERE user_id = auth.uid()
    )
  );

-- SESSION LOGS: follow session access
CREATE POLICY "slogs_tenant" ON session_logs
  FOR ALL USING (
    session_id IN (
      SELECT id FROM training_sessions WHERE tenant_id = get_tenant_id()
    )
  );

-- BODY MEASUREMENTS: owner/coach see assigned, athlete sees own
CREATE POLICY "measurements_owner_coach" ON body_measurements
  FOR ALL USING (
    athlete_id IN (
      SELECT id FROM athletes
      WHERE tenant_id = get_tenant_id()
      AND (get_user_role() = 'owner'
           OR (get_user_role() = 'coach' AND assigned_coach_id = auth.uid()))
    )
  );

CREATE POLICY "measurements_athlete_self" ON body_measurements
  FOR ALL USING (
    athlete_id IN (
      SELECT id FROM athletes
      WHERE user_id = auth.uid()
    )
  );

-- SUBSCRIPTIONS: owner only
CREATE POLICY "subscriptions_owner" ON subscriptions
  FOR SELECT USING (tenant_id = get_tenant_id() AND get_user_role() = 'owner');
