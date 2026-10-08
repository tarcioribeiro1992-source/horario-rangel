-- Re-grant all privileges to ensure PostgREST can access all tables
GRANT ALL ON TABLE professores TO anon, authenticated;
GRANT ALL ON TABLE disciplinas TO anon, authenticated;
GRANT ALL ON TABLE turmas TO anon, authenticated;
GRANT ALL ON TABLE versoes_horario TO anon, authenticated;
GRANT ALL ON TABLE grade_horaria TO anon, authenticated;
GRANT ALL ON TABLE ocorrencias TO anon, authenticated;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';