import { createClient } from '@supabase/supabase-js';

// O link de confirmação do cadastro volta com "type=signup" no endereço.
// Precisa ser lido antes do createClient, que limpa o endereço ao abrir a sessão.
export const voltouDaConfirmacaoDeEmail = window.location.hash.includes('type=signup');

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
