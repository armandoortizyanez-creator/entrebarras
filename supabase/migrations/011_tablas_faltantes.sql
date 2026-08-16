-- Migration 011: capturar tres tablas que existian en produccion sin migracion
--
-- Al comparar el esquema real contra supabase/migrations/ aparecieron tres
-- tablas creadas a mano que nunca quedaron en el repo:
--
--   box_schedule      -> Programacion
--   personal_records  -> Calculadora y PRs
--   wod_results       -> resultados y ranking de WODs
--
-- Quien clonara el proyecto hoy levantaria una base sin ellas, y esas tres
-- secciones fallarian. Esto reproduce su definicion exacta tal como esta en
-- produccion, incluidos indices, claves foraneas y RLS.
--
-- Es idempotente: en la base actual no cambia nada.

-- ─── box_schedule ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS box_schedule (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  scheduled_date DATE NOT NULL,
  wod_id         UUID REFERENCES wods(id)     ON DELETE SET NULL,
  routine_id     UUID REFERENCES routines(id) ON DELETE SET NULL,
  group_id       UUID REFERENCES groups(id)   ON DELETE SET NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  -- Una entrada por dia y equipo. Con group_id nulo significa "todo el box".
  UNIQUE (tenant_id, scheduled_date, group_id)
);

CREATE INDEX IF NOT EXISTS idx_box_schedule_date
  ON box_schedule (tenant_id, scheduled_date);

ALTER TABLE box_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON box_schedule;
CREATE POLICY tenant_isolation ON box_schedule
  FOR ALL TO authenticated
  USING (tenant_id = get_tenant_id());

-- ─── personal_records ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) DEFAULT get_tenant_id(),
  athlete_id    UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  movement_name TEXT NOT NULL,
  weight_kg     NUMERIC(6,2) NOT NULL,
  reps          INTEGER NOT NULL DEFAULT 1,
  estimated_1rm NUMERIC(6,2),
  recorded_at   DATE NOT NULL DEFAULT CURRENT_DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Ordenado por fecha descendente: la consulta habitual es "la marca mas reciente"
CREATE INDEX IF NOT EXISTS pr_athlete_movement
  ON personal_records (athlete_id, movement_name, recorded_at DESC);

ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON personal_records;
CREATE POLICY tenant_isolation ON personal_records
  FOR ALL TO authenticated
  USING (tenant_id = get_tenant_id());

-- ─── wod_results ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wod_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  wod_id      UUID NOT NULL REFERENCES wods(id)     ON DELETE CASCADE,
  -- SET NULL y no CASCADE: el resultado sobrevive aunque el atleta se elimine,
  -- para no romper el ranking historico del WOD.
  athlete_id  UUID REFERENCES athletes(id) ON DELETE SET NULL,
  scale       TEXT NOT NULL DEFAULT 'rx',
  time_s      INTEGER,
  rounds      INTEGER,
  reps        INTEGER,
  weight_kg   NUMERIC(6,2),
  result_text TEXT,
  notes       TEXT,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wod_results_athlete
  ON wod_results (athlete_id, recorded_at DESC);

-- Indice del ranking: agrupa por WOD y escala, y ordena por el resultado
CREATE INDEX IF NOT EXISTS idx_wod_results_wod
  ON wod_results (wod_id, scale, time_s, rounds DESC, reps DESC);

ALTER TABLE wod_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON wod_results;
CREATE POLICY tenant_isolation ON wod_results
  FOR ALL TO authenticated
  USING (tenant_id = get_tenant_id());
