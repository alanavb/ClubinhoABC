// RN1 — Atividade pertence a uma etapa (controle de acesso)
// RN3 — Atividade obrigatória (conclusão da etapa)
// Consulta o back-end (Flask), que é quem sabe em qual etapa a criança está
// e quais atividades obrigatórias já foram realizadas.

import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from './api';
import { obterCriancaId, obterToken } from './auth';

function cabecalhosAutenticados() {
  const token = obterToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function buscarResumoProgresso(criancaId = obterCriancaId()) {
  const resposta = await fetch(`${API_BASE_URL}/criancas/${criancaId}/progresso`, {
    headers: cabecalhosAutenticados(),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json(); // { child_id, estrelas, atividades_concluidas, tentativas, etapas }
}

// Progresso real da criança, recarregado a cada resultado correto ou mudança de etapa.
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
    setResumo(null); // ao trocar de criança, não mostra o progresso da anterior
    recarregar();
    window.addEventListener('progresso-atualizado', recarregar);
    return () => window.removeEventListener('progresso-atualizado', recarregar);
  }, [recarregar]);

  return { resumo, erro, recarregar };
}

export async function buscarStatusEtapa(etapaId) {
  const resposta = await fetch(`${API_BASE_URL}/criancas/${obterCriancaId()}/etapas/${etapaId}/status`, {
    headers: cabecalhosAutenticados(),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}

export async function buscarAtividadesDaEtapa(chaveEtapa) {
  const resposta = await fetch(`${API_BASE_URL}/etapas/${chaveEtapa}/atividades`, {
    headers: cabecalhosAutenticados(),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}

export async function concluirEtapa(etapaId) {
  const resposta = await fetch(`${API_BASE_URL}/criancas/${obterCriancaId()}/etapas/${etapaId}/concluir`, {
    method: 'POST',
    headers: cabecalhosAutenticados(),
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}
