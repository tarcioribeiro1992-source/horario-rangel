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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const [tRes, sRes, cRes, gRes, oRes, vRes] = await Promise.all([
      supabase.from("professores").select("*"),
      supabase.from("disciplinas").select("*"),
      supabase.from("turmas").select("*"),
      supabase.from("grade_horaria").select("*"),
      supabase.from("ocorrencias").select("*"),
      supabase.from("versoes_horario").select("*"),
    ]);

    const errors: string[] = [];
    if (tRes.error) errors.push(`professores: ${tRes.error.message}`);
    if (sRes.error) errors.push(`disciplinas: ${sRes.error.message}`);
    if (cRes.error) errors.push(`turmas: ${cRes.error.message}`);
    if (gRes.error) errors.push(`grade_horaria: ${gRes.error.message}`);
    if (oRes.error) errors.push(`ocorrencias: ${oRes.error.message}`);
    if (vRes.error) errors.push(`versoes_horario: ${vRes.error.message}`);

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: errors.join("; ") }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      teachers: tRes.data || [],
      subjects: sRes.data || [],
      classes: cRes.data || [],
      grid: gRes.data || [],
      occurrences: oRes.data || [],
      schedules: vRes.data || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
