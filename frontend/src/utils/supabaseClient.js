import { createClient } from '@supabase/supabase-js';

// lido antes do createClient, que limpa o endereço ao abrir a sessão
export const voltouDaConfirmacaoDeEmail = window.location.hash.includes('type=signup');

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
