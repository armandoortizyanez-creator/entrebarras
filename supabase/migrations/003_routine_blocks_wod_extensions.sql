-- Migration 003: Extend routine_blocks with WOD fields and fix CHECK constraints

-- ─── 1. routine_blocks: drop old CHECK, add new types + WOD columns ────────────

ALTER TABLE routine_blocks DROP CONSTRAINT IF EXISTS routine_blocks_type_check;

ALTER TABLE routine_blocks
  ADD COLUMN IF NOT EXISTS wod_type         TEXT,
  ADD COLUMN IF NOT EXISTS time_cap         INTEGER,       -- minutes
  ADD COLUMN IF NOT EXISTS interval_work_s  INTEGER,       -- seconds
  ADD COLUMN IF NOT EXISTS interval_rest_s  INTEGER,       -- seconds
  ADD COLUMN IF NOT EXISTS rounds           INTEGER;

ALTER TABLE routine_blocks
  ADD CONSTRAINT routine_blocks_type_check CHECK (
    type IN ('standard','superset','circuit','warmup','strength','wod','emom','cooldown','accessory')
  );

ALTER TABLE routine_blocks
  ADD CONSTRAINT routine_blocks_wod_type_check CHECK (
    wod_type IS NULL OR wod_type IN ('amrap','for_time','emom','tabata','chipper','intervals','custom')
  );

-- ─── 2. routine_exercises: add weight_percent ───────────────────────────────────

ALTER TABLE routine_exercises
  ADD COLUMN IF NOT EXISTS weight_percent NUMERIC(5,2);

-- ─── 3. routines: fix type CHECK to include weightlifting, kinesiology, other ──

ALTER TABLE routines DROP CONSTRAINT IF EXISTS routines_type_check;

ALTER TABLE routines
  ADD CONSTRAINT routines_type_check CHECK (
    type IS NULL OR type IN (
      'strength','hypertrophy','cardio','crossfit','rehab','general',
      'weightlifting','kinesiology','other'
    )
  );

-- ─── 4. exercises: fix source CHECK to include crossfit, strength, hyrox, gymnastics ──

ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_source_check;

ALTER TABLE exercises
  ADD CONSTRAINT exercises_source_check CHECK (
    source IN ('exercisedb','custom','crossfit','strength','hyrox','gymnastics')
  );

-- ─── 5. athlete_routines: create if missing ────────────────────────────────────

CREATE TABLE IF NOT EXISTS athlete_routines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  routine_id    UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  assigned_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, routine_id)
);

ALTER TABLE athlete_routines ENABLE ROW LEVEL SECURITY;

-- Coaches/admins can read and manage assignments for their tenant
CREATE POLICY IF NOT EXISTS "athlete_routines_staff" ON athlete_routines
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes a
      JOIN users u ON u.id = a.tenant_id::text::uuid OR u.tenant_id = a.tenant_id
      WHERE a.id = athlete_routines.athlete_id
        AND u.auth_user_id = auth.uid()
        AND u.role IN ('super_admin','coach')
    )
  );

-- Athletes can read their own assignments
CREATE POLICY IF NOT EXISTS "athlete_routines_athlete_read" ON athlete_routines
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM athletes a
      JOIN users u ON u.id = a.user_id
      WHERE a.id = athlete_routines.athlete_id
        AND u.auth_user_id = auth.uid()
    )
  );
