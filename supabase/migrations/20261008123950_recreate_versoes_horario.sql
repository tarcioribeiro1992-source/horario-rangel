-- Drop and recreate versoes_horario to force PostgREST to pick it up
-- First, save existing data
CREATE TABLE IF NOT EXISTS versoes_horario_backup AS SELECT * FROM versoes_horario;

-- Drop the table (this forces PostgREST to invalidate its cache for this table)
DROP TABLE IF EXISTS versoes_horario CASCADE;

-- Recreate with exact same schema
CREATE TABLE versoes_horario (
  id text PRIMARY KEY,
  nome text NOT NULL,
  is_regular boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Restore data
INSERT INTO versoes_horario SELECT * FROM versoes_horario_backup;

-- Drop backup
DROP TABLE versoes_horario_backup;

-- Enable RLS
ALTER TABLE versoes_horario ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "anon_select_versoes" ON versoes_horario FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_versoes" ON versoes_horario FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_versoes" ON versoes_horario FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_versoes" ON versoes_horario FOR DELETE TO anon, authenticated USING (true);

-- Grant privileges
GRANT ALL ON TABLE versoes_horario TO anon, authenticated;

-- Re-add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE versoes_horario;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';