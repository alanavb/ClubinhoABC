// RF06: indicadores do painel do responsável

import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL } from './api';
import { obterToken } from './auth';

export async function buscarDashboard(criancaId, { periodo = 'tudo', etapa = '' } = {}) {
  const token = obterToken();
  const filtros = new URLSearchParams({ periodo });
  if (etapa) filtros.set('etapa', etapa);
  const resposta = await fetch(`${API_BASE_URL}/criancas/${criancaId}/dashboard?${filtros}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json(); // { totais, por_etapa, evolucao, dificuldades, recomendacoes }
}

// Atualiza indicadores após registrar progresso
export function useDashboard(criancaId, periodo = 'tudo', etapa = '') {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(false);

  const recarregar = useCallback(() => {
    if (!criancaId) return;
    setErro(false);
    buscarDashboard(criancaId, { periodo, etapa })
      .then((resposta) => {
        // ignora resposta atrasada de outra criança ou de outro filtro
        // (back-end antigo não devolve os filtros: vale como "desde o início, todas as etapas")
        const mesmoFiltro = (resposta.periodo ?? 'tudo') === periodo && String(resposta.etapa_id ?? '') === String(etapa);
        if (resposta.child_id === criancaId && mesmoFiltro) setDados(resposta);
      })
      .catch(() => setErro(true));
  }, [criancaId, periodo, etapa]);

  useEffect(() => {
    setDados(null); // não mostra dados da criança anterior
    recarregar();
    window.addEventListener('progresso-atualizado', recarregar);
    return () => window.removeEventListener('progresso-atualizado', recarregar);
  }, [recarregar]);

  return { dados, erro, recarregar };
}
