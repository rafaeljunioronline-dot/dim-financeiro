import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- ÁREA DE DEBUG (OLHE NO CONSOLE DO NAVEGADOR) ---
console.log("--- DEBUG SUPABASE ---");
console.log("URL:", supabaseUrl);
console.log("KEY (primeiros 10 chars):", supabaseAnonKey ? supabaseAnonKey.substring(0, 10) : "NÃO ENCONTRADA");
// ----------------------------------------------------

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("ERRO CRÍTICO: Variáveis de ambiente do Supabase estão faltando.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);