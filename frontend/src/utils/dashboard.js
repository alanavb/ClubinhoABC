// RF06 — Dashboard de desempenho: busca no back-end (Flask) os indicadores da criança.

import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from './api';
import { obterToken } from './auth';

export async function buscarDashboard(criancaId) {
  const token = obterToken();
  const resposta = await fetch(`${API_BASE_URL}/criancas/${criancaId}/dashboard`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json(); // { totais, por_etapa, evolucao, dificuldades, recomendacoes }
}

// Recarrega sozinho quando a criança acerta uma atividade (mesmo evento do progresso).
export function useDashboard(criancaId) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(false);

  const recarregar = useCallback(() => {
    if (!criancaId) return;
    setErro(false);
    buscarDashboard(criancaId)
      .then((resposta) => { if (resposta.child_id === criancaId) setDados(resposta); })
      .catch(() => setErro(true));
  }, [criancaId]);

  useEffect(() => {
    setDados(null); // ao trocar de criança, não mostra os dados da anterior
    recarregar();
    window.addEventListener('progresso-atualizado', recarregar);
    return () => window.removeEventListener('progresso-atualizado', recarregar);
  }, [recarregar]);

  return { dados, erro, recarregar };
}
