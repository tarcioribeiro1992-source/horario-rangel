import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Variáveis de ambiente do Supabase não encontradas. Usando modo de segurança local.');
}

export const supabase = createClient(
  supabaseUrl || 'https://supabase.co',
  supabaseAnonKey || 'placeholder'
);
