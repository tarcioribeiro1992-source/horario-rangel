-- Force PostgREST schema cache to refresh by altering the table
-- The versao_id column already exists but PostgREST hasn't cached it
ALTER TABLE grade_horaria ADD COLUMN IF NOT EXISTS versao_id text NOT NULL DEFAULT 'regular';

-- Create a dummy column and immediately drop it to force schema cache invalidation
ALTER TABLE grade_horaria ADD COLUMN IF NOT EXISTS _schema_cache_refresh text DEFAULT '';
ALTER TABLE grade_horaria DROP COLUMN IF EXISTS _schema_cache_refresh;

-- Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';