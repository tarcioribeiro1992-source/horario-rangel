import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface SyncRequest {
  teachers?: Array<{ id: string; nome: string; email: string; telefone: string }>;
  subjects?: Array<{ id: string; nome: string; cor: string }>;
  classes?: Array<{ id: string; nome: string; ano_serie: string }>;
  schedules?: Array<{ id: string; nome: string; is_regular: boolean }>;
  grid?: Array<{ id: string; dia_semana: string; bloco_horario: string; professor_id: string; disciplina: string; turma: string; versao_id: string }>;
  occurrences?: Array<{ id: string; data: string; bloco_horario: string; tipo: string; professor_id: string; motivo: string }>;
  deletes?: Record<string, Array<{ column: string; value: string }>>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: SyncRequest = await req.json();
    const results: Record<string, any> = {};

    if (body.teachers && body.teachers.length > 0) {
      const { data, error } = await supabase.from("professores").upsert(body.teachers, { onConflict: "id" }).select();
      results.teachers = error ? { error: error.message } : { count: data?.length || 0 };
    }

    if (body.subjects && body.subjects.length > 0) {
      const { data, error } = await supabase.from("disciplinas").upsert(body.subjects, { onConflict: "id" }).select();
      results.subjects = error ? { error: error.message } : { count: data?.length || 0 };
    }

    if (body.classes && body.classes.length > 0) {
      const { data, error } = await supabase.from("turmas").upsert(body.classes, { onConflict: "id" }).select();
      results.classes = error ? { error: error.message } : { count: data?.length || 0 };
    }

    if (body.schedules && body.schedules.length > 0) {
      const { data, error } = await supabase.from("versoes_horario").upsert(body.schedules, { onConflict: "id" }).select();
      results.schedules = error ? { error: error.message } : { count: data?.length || 0 };
    }

    if (body.grid && body.grid.length > 0) {
      const { data, error } = await supabase.from("grade_horaria").upsert(body.grid, { onConflict: "id" }).select();
      results.grid = error ? { error: error.message } : { count: data?.length || 0 };
    }

    if (body.occurrences && body.occurrences.length > 0) {
      const { data, error } = await supabase.from("ocorrencias").upsert(body.occurrences, { onConflict: "id" }).select();
      results.occurrences = error ? { error: error.message } : { count: data?.length || 0 };
    }

    if (body.deletes) {
      const tableMap: Record<string, string> = {
        professores: "professores",
        disciplinas: "disciplinas",
        turmas: "turmas",
        grade_horaria: "grade_horaria",
        versoes_horario: "versoes_horario",
        ocorrencias: "ocorrencias",
      };

      for (const [tableKey, filters] of Object.entries(body.deletes)) {
        const tableName = tableMap[tableKey] || tableKey;
        let query = supabase.from(tableName).delete();
        for (const f of filters) {
          query = query.eq(f.column, f.value);
        }
        const { error } = await query;
        results[`delete_${tableKey}`] = error ? { error: error.message } : { success: true };
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
