-- Entrebarras — Schema v2
-- Ejecuta esto en el SQL Editor de Supabase

-- ============================================================
-- MÓDULO 1: CLIENTES
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  active      BOOLEAN DEFAULT true,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainer_owns_clients" ON clients
  FOR ALL
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- ============================================================
-- MÓDULO 3: WODs (Workout of the Day)
-- ============================================================
CREATE TABLE IF NOT EXISTS wods (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id      UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  title          TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('AMRAP','FOR TIME','EMOM','TABATA','RFT','STRENGTH','SKILL')),
  scheduled_date DATE NOT NULL,
  duration_min   INTEGER,
  rounds         INTEGER,
  notes          TEXT,
  completed      BOOLEAN DEFAULT false,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainer_owns_wods" ON wods
  FOR ALL
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- ============================================================
-- MÓDULO 3: EJERCICIOS DEL WOD
-- ============================================================
CREATE TABLE IF NOT EXISTS wod_exercises (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wod_id       UUID REFERENCES wods(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  reps         INTEGER,
  sets         INTEGER,
  weight_kg    NUMERIC,
  distance_m   INTEGER,
  calories     INTEGER,
  time_seconds INTEGER,
  order_index  INTEGER DEFAULT 0
);

ALTER TABLE wod_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainer_owns_wod_exercises" ON wod_exercises
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM wods
      WHERE wods.id = wod_exercises.wod_id
        AND wods.trainer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM wods
      WHERE wods.id = wod_exercises.wod_id
        AND wods.trainer_id = auth.uid()
    )
  );
