-- Drop and recreate grade_horaria to force PostgREST to pick up versao_id column
CREATE TABLE IF NOT EXISTS grade_horaria_backup AS SELECT * FROM grade_horaria;

DROP TABLE IF EXISTS grade_horaria CASCADE;

CREATE TABLE grade_horaria (
  id text PRIMARY KEY,
  dia_semana text NOT NULL,
  bloco_horario text NOT NULL,
  professor_id text DEFAULT 'sem-professor',
  disciplina text DEFAULT '',
  turma text DEFAULT '',
  versao_id text NOT NULL DEFAULT 'regular',
  created_at timestamptz DEFAULT now()
);

INSERT INTO grade_horaria SELECT * FROM grade_horaria_backup;
DROP TABLE grade_horaria_backup;

ALTER TABLE grade_horaria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_grade" ON grade_horaria FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_grade" ON grade_horaria FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_grade" ON grade_horaria FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_grade" ON grade_horaria FOR DELETE TO anon, authenticated USING (true);

GRANT ALL ON TABLE grade_horaria TO anon, authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE grade_horaria;

NOTIFY pgrst, 'reload schema';