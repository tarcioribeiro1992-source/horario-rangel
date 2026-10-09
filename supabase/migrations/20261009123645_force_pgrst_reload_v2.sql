-- Force PostgREST schema cache reload by performing a no-op DDL change
-- The pgrst_ddl_watch event trigger fires on ddl_command_end and sends a NOTIFY to PostgREST
CREATE OR REPLACE FUNCTION public._tmp_schema_reload() RETURNS void AS $$ BEGIN END; $$ LANGUAGE plpgsql;
DROP FUNCTION IF EXISTS public._tmp_schema_reload();
NOTIFY pgrst, 'reload schema';