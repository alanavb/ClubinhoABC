// RN1: atividade pertence a uma etapa (controle de acesso)
// RN3: atividade obrigatória (conclusão da etapa)
// a etapa atual e as obrigatórias feitas vêm sempre do back-end

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

// recarrega no evento 'progresso-atualizado'
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
    setResumo(null); // não mostra o progresso da criança anterior
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
