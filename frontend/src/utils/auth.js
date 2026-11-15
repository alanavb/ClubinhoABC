// Login, cadastro e sessão (Supabase Auth) + perfil da família (nossa API).


import { API_BASE_URL } from './api';
import { supabase, voltouDaConfirmacaoDeEmail } from './supabaseClient';

let sessaoSupabase = null;
let perfil = null; // { responsavel_id, nome, email, criancas } vindo de /auth/me
let redefinicaoPendente = false; // chegou pelo link de "esqueci a senha"
let confirmacaoPendente = voltouDaConfirmacaoDeEmail;
let emailAcabouDeSerConfirmado = false;
let loginAcabouDeAcontecer = false; // SIGNED_IN de entrar(), não de recarregar a página
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
    perfil = null; // confirmada no Supabase, cadastro ainda não concluído aqui
    return;
  }
  if (!resposta.ok) {
    perfil = null;
    return;
  }
  perfil = await resposta.json();
}

// sessão única: só este login passa a valer no back-end
async function registrarSessaoAtiva() {
  await fetch(`${API_BASE_URL}/auth/sessao`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessaoSupabase.access_token}` },
  });
}

// primeiro login: cria o perfil com os dados da criança guardados no user_metadata do cadastro
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
  if (session && confirmacaoPendente) {
    // o link de confirmação já abre sessão; fecha para a pessoa entrar pelo login
    confirmacaoPendente = false;
    emailAcabouDeSerConfirmado = true;
    sessaoSupabase = null;
    setTimeout(() => supabase.auth.signOut({ scope: 'local' }), 0); // signOut dentro do callback trava o Supabase
    avisarOuvintes();
    return;
  }
  if (event === 'PASSWORD_RECOVERY') {
    redefinicaoPendente = true;
  }
  if (session) {
    try {
      if (loginAcabouDeAcontecer) {
        loginAcabouDeAcontecer = false;
        await registrarSessaoAtiva();
      }
      await sincronizarPerfil();
      await completarCadastroSePendente();
    } catch (erro) {
      // back-end fora do ar: tenta de novo na próxima mudança de sessão
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

export function emailFoiConfirmado() {
  return emailAcabouDeSerConfirmado;
}

// false só quando a API diz que a sessão foi trocada; erro de rede não derruba ninguém
export async function sessaoContinuaAtiva() {
  if (!sessaoSupabase?.access_token) return true;
  try {
    const resposta = await fetch(`${API_BASE_URL}/auth/sessao`, {
      headers: { Authorization: `Bearer ${sessaoSupabase.access_token}` },
    });
    if (resposta.status !== 401) return true;
    const dados = await resposta.json().catch(() => ({}));
    return dados.codigo !== 'sessao_encerrada';
  } catch {
    return true;
  }
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

// jogos, estrelas e progresso usam a criança selecionada
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
    // sem localStorage a escolha só se perde ao recarregar
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

export async function excluirCrianca({ criancaId, confirmacao }) {
  const resposta = await fetch(`${API_BASE_URL}/criancas/${criancaId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessaoSupabase?.access_token}`,
    },
    body: JSON.stringify({ confirmacao }),
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível excluir a criança.');

  perfil = {
    ...perfil,
    criancas: perfil.criancas.filter((crianca) => crianca.crianca_id !== criancaId),
  };
  if (lerCriancaSelecionada() === criancaId) {
    try {
      localStorage.removeItem(CHAVE_CRIANCA_SELECIONADA);
    } catch {
      // sem localStorage, segue com a primeira criança
    }
  }
  avisarOuvintes();
}

export async function excluirConta(confirmacao) {
  const resposta = await fetch(`${API_BASE_URL}/auth/conta`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sessaoSupabase?.access_token}`,
    },
    body: JSON.stringify({ confirmacao }),
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível excluir a conta.');

  // conta já apagada no servidor: nada da sessão antiga fica no navegador
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  sessaoSupabase = null;
  perfil = null;
  try {
    localStorage.removeItem(CHAVE_CRIANCA_SELECIONADA);
  } catch {
    // localStorage indisponível não impede o encerramento
  }
  avisarOuvintes();
}

export function obterPerfil() {
  return perfil;
}

function mensagemAmigavel(erro) {
  const texto = erro?.message || '';
  // 429: limites de tentativas e de e-mail do Supabase Auth
  if (erro?.code === 'over_email_send_rate_limit') return 'Muitos e-mails enviados em pouco tempo. Aguarde alguns minutos e tente novamente.';
  if (erro?.status === 429) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  if (texto.includes('Invalid login credentials')) return 'E-mail ou senha inválidos.';
  if (texto.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  return texto || 'Não foi possível completar a operação.';
}

export async function entrar(email, senha) {
  loginAcabouDeAcontecer = true;
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) {
    loginAcabouDeAcontecer = false;
    throw new Error(mensagemAmigavel(error));
  }
  emailAcabouDeSerConfirmado = false;
}

// pede a senha de novo antes de abrir a Minha Conta
export async function confirmarSenhaResponsavel(senha) {
  const email = perfil?.email || sessaoSupabase?.user?.email;
  if (!email) throw new Error('Não foi possível identificar a conta do responsável.');

  // entrar de novo cria outra sessão: também precisa ser registrada
  loginAcabouDeAcontecer = true;
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) {
    loginAcabouDeAcontecer = false;
    throw new Error(mensagemAmigavel(error));
  }
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
  // e-mail já cadastrado não dá erro: o Supabase não revela quais e-mails têm conta
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
