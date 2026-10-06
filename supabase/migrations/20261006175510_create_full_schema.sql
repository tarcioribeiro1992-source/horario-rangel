/*
# Create full database schema for HorárioRangel

1. New Tables
- `professores` — teachers: id (text PK), nome, email, telefone, created_at
- `disciplinas` — subjects: id (text PK), nome, cor, created_at
- `turmas` — school classes: id (text PK), nome, ano_serie, created_at
- `versoes_horario` — schedule versions: id (text PK), nome, is_regular, created_at
- `grade_horaria` — weekly grid slots: id (text PK), dia_semana, bloco_horario, professor_id, disciplina, turma, versao_id, created_at
- `ocorrencias` — occurrences: id (text PK), data, bloco_horario, tipo, professor_id, motivo, created_at
2. Security
- RLS enabled on all tables.
- All tables allow anon + authenticated CRUD (single-tenant, no auth — intentionally public/shared).
3. Notes
- This is a single-tenant app with no sign-in screen, so all data is shared/public.
- The 'regular' schedule version is seeded automatically.
- `versao_id` on grade_horaria defaults to 'regular' so existing rows always belong to a schedule version.
*/

CREATE TABLE IF NOT EXISTS professores (
  id text PRIMARY KEY,
  nome text NOT NULL,
  email text DEFAULT '',
  telefone text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disciplinas (
  id text PRIMARY KEY,
  nome text NOT NULL,
  cor text DEFAULT '#2563eb',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS turmas (
  id text PRIMARY KEY,
  nome text NOT NULL,
  ano_serie text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS versoes_horario (
  id text PRIMARY KEY,
  nome text NOT NULL,
  is_regular boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grade_horaria (
  id text PRIMARY KEY,
  dia_semana text NOT NULL,
  bloco_horario text NOT NULL,
  professor_id text DEFAULT 'sem-professor',
  disciplina text DEFAULT '',
  turma text DEFAULT '',
  versao_id text NOT NULL DEFAULT 'regular',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ocorrencias (
  id text PRIMARY KEY,
  data text DEFAULT '',
  bloco_horario text DEFAULT '',
  tipo text DEFAULT '',
  professor_id text DEFAULT 'sem-professor',
  motivo text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE versoes_horario ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_horaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;

-- professores policies
DROP POLICY IF EXISTS "anon_select_professores" ON professores;
CREATE POLICY "anon_select_professores" ON professores FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_professores" ON professores;
CREATE POLICY "anon_insert_professores" ON professores FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_professores" ON professores;
CREATE POLICY "anon_update_professores" ON professores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_professores" ON professores;
CREATE POLICY "anon_delete_professores" ON professores FOR DELETE TO anon, authenticated USING (true);

-- disciplinas policies
DROP POLICY IF EXISTS "anon_select_disciplinas" ON disciplinas;
CREATE POLICY "anon_select_disciplinas" ON disciplinas FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_disciplinas" ON disciplinas;
CREATE POLICY "anon_insert_disciplinas" ON disciplinas FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_disciplinas" ON disciplinas;
CREATE POLICY "anon_update_disciplinas" ON disciplinas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_disciplinas" ON disciplinas;
CREATE POLICY "anon_delete_disciplinas" ON disciplinas FOR DELETE TO anon, authenticated USING (true);

-- turmas policies
DROP POLICY IF EXISTS "anon_select_turmas" ON turmas;
CREATE POLICY "anon_select_turmas" ON turmas FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_turmas" ON turmas;
CREATE POLICY "anon_insert_turmas" ON turmas FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_turmas" ON turmas;
CREATE POLICY "anon_update_turmas" ON turmas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_turmas" ON turmas;
CREATE POLICY "anon_delete_turmas" ON turmas FOR DELETE TO anon, authenticated USING (true);

-- versoes_horario policies
DROP POLICY IF EXISTS "anon_select_versoes" ON versoes_horario;
CREATE POLICY "anon_select_versoes" ON versoes_horario FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_versoes" ON versoes_horario;
CREATE POLICY "anon_insert_versoes" ON versoes_horario FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_versoes" ON versoes_horario;
CREATE POLICY "anon_update_versoes" ON versoes_horario FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_versoes" ON versoes_horario;
CREATE POLICY "anon_delete_versoes" ON versoes_horario FOR DELETE TO anon, authenticated USING (true);

-- grade_horaria policies
DROP POLICY IF EXISTS "anon_select_grade" ON grade_horaria;
CREATE POLICY "anon_select_grade" ON grade_horaria FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_grade" ON grade_horaria;
CREATE POLICY "anon_insert_grade" ON grade_horaria FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_grade" ON grade_horaria;
CREATE POLICY "anon_update_grade" ON grade_horaria FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_grade" ON grade_horaria;
CREATE POLICY "anon_delete_grade" ON grade_horaria FOR DELETE TO anon, authenticated USING (true);

-- ocorrencias policies
DROP POLICY IF EXISTS "anon_select_ocorrencias" ON ocorrencias;
CREATE POLICY "anon_select_ocorrencias" ON ocorrencias FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ocorrencias" ON ocorrencias;
CREATE POLICY "anon_insert_ocorrencias" ON ocorrencias FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_ocorrencias" ON ocorrencias;
CREATE POLICY "anon_update_ocorrencias" ON ocorrencias FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ocorrencias" ON ocorrencias;
CREATE POLICY "anon_delete_ocorrencias" ON ocorrencias FOR DELETE TO anon, authenticated USING (true);

-- Seed the regular schedule version
INSERT INTO versoes_horario (id, nome, is_regular)
VALUES ('regular', 'Grade Regular', true)
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE professores;
ALTER PUBLICATION supabase_realtime ADD TABLE disciplinas;
ALTER PUBLICATION supabase_realtime ADD TABLE turmas;
ALTER PUBLICATION supabase_realtime ADD TABLE versoes_horario;
ALTER PUBLICATION supabase_realtime ADD TABLE grade_horaria;
ALTER PUBLICATION supabase_realtime ADD TABLE ocorrencias;
