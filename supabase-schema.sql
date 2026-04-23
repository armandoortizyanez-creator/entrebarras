-- Ejecutar en el SQL Editor de supabase.com → tu proyecto → SQL Editor

-- exercises type: [{name: string, sets: number, reps: number, notes?: string}]
CREATE TABLE routines (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  exercises    JSONB NOT NULL DEFAULT '[]',
  share_token  TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Trainers solo ven y modifican sus propias rutinas
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainer_owns_routines" ON routines
  FOR ALL
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Lectura pública por share_token (clientes sin login)
-- La validación del token ocurre en la query de la API route (eq share_token)
CREATE POLICY "public_read_by_token" ON routines
  FOR SELECT
  TO anon
  USING (true);
