import { createClient } from '@supabase/supabase-js'

// --- ATENÇÃO AQUI ---
// Estou forçando o endereço CORRETO que vimos no seu token (sjcuyaf...)
// Se o erro de "Network" persistir, é impossível, pois este endereço existe.

const supabaseUrl = 'https://sjcuyafvewryloniswpo.supabase.co'

// COLE AQUI A SUA CHAVE 'anon' 'public' DO SITE DO SUPABASE
// (Não use a service_role aqui!)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqY3V5YWZ2ZXdyeWxvbmlzd3BvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzI0MDMsImV4cCI6MjA4MDQ0ODQwM30.obkz8HwccegT-L7ZHSG1DLuPJI4OVmPAyFZShfFoyFQ'

export const supabase = createClient(supabaseUrl, supabaseKey)