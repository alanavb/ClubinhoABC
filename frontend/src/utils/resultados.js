// RN2 — Registro do resultado da atividade
// Envia cada tentativa da criança para o back-end (Flask), que verifica se a
// resposta enviada bate com a esperada e persiste o resultado associado à
// criança e à atividade.

import { API_BASE_URL } from './api';
import { obterCriancaId, obterToken } from './auth';

export { API_BASE_URL };

function publicarAviso(mensagem, acao = null) {
  window.dispatchEvent(new CustomEvent('clubinho:aviso', { detail: { mensagem, acao } }));
}

function mensagemAmigavel(status) {
  if (status === 401) {
    return {
      mensagem: 'Sua sessão terminou. Entre novamente para continuar brincando.',
      acao: 'entrar',
    };
  }
  if (status === 403) {
    return { mensagem: 'Não foi possível salvar esta resposta. Volte à sua trilha e tente novamente.' };
  }
  if (status === 400) {
    return { mensagem: 'Não foi possível registrar a resposta agora. Tente novamente.' };
  }
  return { mensagem: 'Tivemos um probleminha ao salvar sua resposta. Tente novamente em instantes.' };
}

function cabecalhosAutenticados(extras = {}) {
  const token = obterToken();
  return token ? { ...extras, Authorization: `Bearer ${token}` } : extras;
}

export async function registrarResultadoPorId(atividadeId, respostaEnviada, respostaEsperada) {
  try {
    const resposta = await fetch(`${API_BASE_URL}/resultados`, {
      method: 'POST',
      headers: cabecalhosAutenticados({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        crianca_id: obterCriancaId(),
        atividade_id: atividadeId,
        resposta_enviada: respostaEnviada,
        resposta_esperada: respostaEsperada,
      }),
    });
    if (!resposta.ok) {
      const aviso = mensagemAmigavel(resposta.status);
      publicarAviso(aviso.mensagem, aviso.acao);
      console.warn('RN2: resposta não salva.', { status: resposta.status });
      return null;
    }
    const resultado = await resposta.json();
    if (resultado.correct) window.dispatchEvent(new Event('progresso-atualizado'));
    return resultado;
  } catch {
    publicarAviso('Não foi possível conectar para salvar sua resposta. Verifique a conexão e tente novamente.');
    console.error('RN2: não foi possível registrar o resultado no back-end.');
    return null;
  }
}

export async function listarResultados() {
  const resposta = await fetch(`${API_BASE_URL}/resultados?crianca_id=${obterCriancaId()}`, {
    headers: cabecalhosAutenticados(),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}
