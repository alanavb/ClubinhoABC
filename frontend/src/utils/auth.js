// Login e controle de acesso — autenticação via Supabase Auth.


import { API_BASE_URL } from './api';
import { supabase } from './supabaseClient';

let sessaoSupabase = null;
let perfil = null; // { responsavel_id, nome, email, criancas: [...] } — vem do nosso back-end
let redefinicaoPendente = false; // true quando a pessoa chegou pelo link de "esqueci a senha"
const ouvintes = new Set();

function avisarOuvintes() {
  ouvintes.forEach((cb) => cb());
}

export function aoMudarSessao(callback) {
  ouvintes.add(callback);
  return () => ouvintes.delete(callback);
}

async function sincronizarPerfil() {
  if (!sessaoSupabase?.access_token) {
    perfil = null;
    return;
  }
  const resposta = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${sessaoSupabase.access_token}` },
  });
  if (resposta.status === 404) {
    perfil = null; // conta confirmada no Supabase, mas cadastro ainda não foi concluído no nosso back-end
    return;
  }
  if (!resposta.ok) {
    perfil = null;
    return;
  }
  perfil = await resposta.json();
}

// Se a pessoa acabou de confirmar o e-mail e ainda não existe perfil no
// back-end, os dados da criança que ficaram guardados no cadastro (Supabase
// user_metadata) são usados para concluir o cadastro automaticamente.
async function completarCadastroSePendente() {
  if (perfil || !sessaoSupabase?.access_token) return;

  const metadata = sessaoSupabase.user?.user_metadata || {};
  if (!metadata.crianca_nome) return; 

  const resposta = await fetch(`${API_BASE_URL}/auth/completar-cadastro`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessaoSupabase.access_token}`,
    },
    body: JSON.stringify({
      nome: metadata.nome,
      crianca_nome: metadata.crianca_nome,
      crianca_data_nascimento: metadata.crianca_data_nascimento,
      crianca_avatar: metadata.crianca_avatar,
    }),
  });
  if (resposta.ok) {
    perfil = await resposta.json();
  }
}

const { data: inscricaoAuth } = supabase.auth.onAuthStateChange(async (event, session) => {
  sessaoSupabase = session;
  if (event === 'PASSWORD_RECOVERY') {
    redefinicaoPendente = true;
  }
  if (session) {
    try {
      await sincronizarPerfil();
      await completarCadastroSePendente();
    } catch (erro) {
      // Uma falha temporária (ex.: back-end fora do ar) não deve travar o
      // app num estado quebrado — a sincronização é refeita na próxima
      // mudança de sessão (outra aba, refresh, novo login).
      console.error('Falha ao sincronizar perfil com o back-end.', erro);
    }
  } else {
    perfil = null;
  }
  avisarOuvintes();
});


if (import.meta.hot) {
  import.meta.hot.dispose(() => inscricaoAuth.subscription.unsubscribe());
}

export function precisaRedefinirSenha() {
  return redefinicaoPendente;
}

export function estaAutenticado() {
  return Boolean(sessaoSupabase?.access_token);
}

export function perfilCompleto() {
  return Boolean(perfil);
}

export function obterToken() {
  return sessaoSupabase?.access_token ?? null;
}

const CHAVE_CRIANCA_SELECIONADA = 'clubinho-crianca-selecionada';

function lerCriancaSelecionada() {
  try {
    return Number(localStorage.getItem(CHAVE_CRIANCA_SELECIONADA)) || null;
  } catch {
    return null;
  }
}

// A família pode ter várias crianças; jogos, estrelas e progresso usam a que estiver selecionada.
export function obterCriancaSelecionada() {
  const criancas = perfil?.criancas ?? [];
  const id = lerCriancaSelecionada();
  return criancas.find((crianca) => crianca.crianca_id === id) ?? criancas[0] ?? null;
}

export function obterCriancaId() {
  return obterCriancaSelecionada()?.crianca_id ?? null;
}

export function selecionarCrianca(criancaId) {
  try {
    localStorage.setItem(CHAVE_CRIANCA_SELECIONADA, String(criancaId));
  } catch {
    // sem armazenamento local a escolha só não sobrevive ao recarregar a página
  }
  avisarOuvintes();
}

export async function adicionarCrianca({ nome, dataNascimento, avatar }) {
  const resposta = await fetch(`${API_BASE_URL}/criancas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessaoSupabase?.access_token}`,
    },
    body: JSON.stringify({ nome, data_nascimento: dataNascimento, avatar }),
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível cadastrar a criança.');

  perfil = { ...perfil, criancas: [...perfil.criancas, dados] };
  selecionarCrianca(dados.crianca_id);
  return dados;
}

export async function editarCrianca({ criancaId, nome, dataNascimento, avatar }) {
  const resposta = await fetch(`${API_BASE_URL}/criancas/${criancaId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessaoSupabase?.access_token}`,
    },
    body: JSON.stringify({ nome, data_nascimento: dataNascimento, avatar }),
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível atualizar os dados da criança.');

  perfil = {
    ...perfil,
    criancas: perfil.criancas.map((crianca) => (
      crianca.crianca_id === dados.crianca_id ? dados : crianca
    )),
  };
  avisarOuvintes();
  return dados;
}

export function obterPerfil() {
  return perfil;
}

function mensagemAmigavel(erro) {
  const texto = erro?.message || '';
  if (texto.includes('Invalid login credentials')) return 'E-mail ou senha inválidos.';
  if (texto.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  return texto || 'Não foi possível completar a operação.';
}

export async function entrar(email, senha) {
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) throw new Error(mensagemAmigavel(error));
}

// Confirma que quem está usando uma sessão já aberta conhece a senha do
// responsável. É usada antes de abrir a área que administra a família.
export async function confirmarSenhaResponsavel(senha) {
  const email = perfil?.email || sessaoSupabase?.user?.email;
  if (!email) throw new Error('Não foi possível identificar a conta do responsável.');

  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) throw new Error(mensagemAmigavel(error));
}

export async function cadastrar({ nome, email, senha, criancaNome, criancaDataNascimento, criancaAvatar }) {
  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        nome,
        crianca_nome: criancaNome,
        crianca_data_nascimento: criancaDataNascimento,
        crianca_avatar: criancaAvatar,
      },
    },
  });
  if (error) throw new Error(mensagemAmigavel(error));
  // O Supabase responde do mesmo jeito (sem sessão) tanto para "reenviando a
  // confirmação de uma conta ainda não confirmada" quanto para "e-mail já
  // confirmado" (não erra, por segurança, pra não revelar quais e-mails têm
  // conta). Nos dois casos a pessoa deve olhar o e-mail ou tentar entrar,
  // então não tratamos isso como erro de cadastro aqui.
}

export async function reenviarConfirmacao(email) {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw new Error(mensagemAmigavel(error));
}

export async function enviarRecuperacaoSenha(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw new Error(mensagemAmigavel(error));
}

export async function atualizarSenha(novaSenha) {
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) throw new Error(mensagemAmigavel(error));
  redefinicaoPendente = false;
  avisarOuvintes();
}

export async function sair() {
  await supabase.auth.signOut();
}
