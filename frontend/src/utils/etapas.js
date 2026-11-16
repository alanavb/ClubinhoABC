// RN1 e RN3: etapas e atividades vêm do back-end

import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from './api';
import { obterCriancaId, obterToken } from './auth';

// Cabeçalhos de requisições autenticadas
function cabecalhosAutenticados() {
  const token = obterToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Consulta do resumo de progresso da criança
export async function buscarResumoProgresso(criancaId = obterCriancaId()) {
  const resposta = await fetch(`${API_BASE_URL}/criancas/${criancaId}/progresso`, {
    headers: cabecalhosAutenticados(),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json(); // { child_id, estrelas, atividades_concluidas, tentativas, etapas }
}

// Atualiza o resumo após registrar progresso
// Atualização reativa do resumo de progresso
export function useResumoProgresso(criancaId) {
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState(false);

  const recarregar = useCallback(() => {
    if (!criancaId) return;
    setErro(false);
    buscarResumoProgresso(criancaId)
      .then((dados) => { if (dados.child_id === criancaId) setResumo(dados); })
      .catch(() => setErro(true));
  }, [criancaId]);

  useEffect(() => {
    setResumo(null); // Limpa o resumo da criança anterior
    recarregar();
    window.addEventListener('progresso-atualizado', recarregar);
    return () => window.removeEventListener('progresso-atualizado', recarregar);
  }, [recarregar]);

  return { resumo, erro, recarregar };
}

// Consulta do status de uma etapa
export async function buscarStatusEtapa(etapaId) {
  const resposta = await fetch(`${API_BASE_URL}/criancas/${obterCriancaId()}/etapas/${etapaId}/status`, {
    headers: cabecalhosAutenticados(),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}

// Consulta das atividades de uma etapa
export async function buscarAtividadesDaEtapa(chaveEtapa) {
  const resposta = await fetch(`${API_BASE_URL}/etapas/${chaveEtapa}/atividades`, {
    headers: cabecalhosAutenticados(),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}

// Solicitação de avanço após concluir uma etapa
export async function concluirEtapa(etapaId) {
  const resposta = await fetch(`${API_BASE_URL}/criancas/${obterCriancaId()}/etapas/${etapaId}/concluir`, {
    method: 'POST',
    headers: cabecalhosAutenticados(),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}
