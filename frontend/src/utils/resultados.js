// RN2 — Registro do resultado da atividade
// Envia cada tentativa da criança para o back-end (Flask), que verifica se a
// resposta enviada bate com a esperada e persiste o resultado associado à
// criança e à atividade.

import { API_BASE_URL } from './api';
import { obterCriancaId, obterToken } from './auth';

export { API_BASE_URL };

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
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const resultado = await resposta.json();
    if (resultado.correct) window.dispatchEvent(new Event('progresso-atualizado'));
    return resultado;
  } catch (erro) {
    console.error('RN2: não foi possível registrar o resultado no back-end.', erro);
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
