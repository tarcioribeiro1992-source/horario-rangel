/*
# Force complete PostgREST schema cache refresh

The versoes_horario and grade_horaria tables were previously dropped and recreated,
but PostgREST's schema cache hasn't picked up the new table OIDs across all instances.

This migration touches every table to force a schema cache reload by:
1. Adding and removing a temporary column on each table (DDL change fires pgrst_ddl_watch)
2. Sending a NOTIFY pgrst reload signal
*/

DO $$
BEGIN
  -- Touch each table to fire ddl_command_end event trigger
  ALTER TABLE versoes_horario ADD COLUMN IF NOT EXISTS _tmp_reload text;
  ALTER TABLE versoes_horario DROP COLUMN IF EXISTS _tmp_reload;

  ALTER TABLE grade_horaria ADD COLUMN IF NOT EXISTS _tmp_reload text;
  ALTER TABLE grade_horaria DROP COLUMN IF EXISTS _tmp_reload;

  ALTER TABLE professores ADD COLUMN IF NOT EXISTS _tmp_reload text;
  ALTER TABLE professores DROP COLUMN IF EXISTS _tmp_reload;

  ALTER TABLE disciplinas ADD COLUMN IF NOT EXISTS _tmp_reload text;
  ALTER TABLE disciplinas DROP COLUMN IF EXISTS _tmp_reload;

  ALTER TABLE turmas ADD COLUMN IF NOT EXISTS _tmp_reload text;
  ALTER TABLE turmas DROP COLUMN IF EXISTS _tmp_reload;

  ALTER TABLE ocorrencias ADD COLUMN IF NOT EXISTS _tmp_reload text;
  ALTER TABLE ocorrencias DROP COLUMN IF EXISTS _tmp_reload;
END $$;

NOTIFY pgrst, 'reload schema';