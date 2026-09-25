// RN1 — Atividade pertence a uma etapa (controle de acesso)
// RN3 — Atividade obrigatória (conclusão da etapa)
// Consulta o back-end (Flask), que é quem sabe em qual etapa a criança está
// e quais atividades obrigatórias já foram realizadas.

import { API_BASE_URL } from './api';
import { obterCriancaId, obterToken } from './auth';

function cabecalhosAutenticados() {
  const token = obterToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function buscarAtividadesAcessiveis() {
  const resposta = await fetch(`${API_BASE_URL}/criancas/${obterCriancaId()}/atividades`, {
    headers: cabecalhosAutenticados(),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json(); // { child_id, etapa_atual_id, atividades: [{ activity_id, chave, nome, obrigatoria }] }
}

export async function buscarStatusEtapa(etapaId) {
  const resposta = await fetch(`${API_BASE_URL}/criancas/${obterCriancaId()}/etapas/${etapaId}/status`, {
    headers: cabecalhosAutenticados(),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json(); // { etapa_id, child_id, concluida, atividades: [...] }
}
