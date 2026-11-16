import { useCallback, useEffect, useState } from 'react';
import { buscarAtividadesDaEtapa, buscarResumoProgresso, buscarStatusEtapa, concluirEtapa } from '../utils/etapas';

// RN3: controle de atividades, acertos e avanço da etapa
export function useEtapa(chaveEtapa) {
  const [etapaId, setEtapaId] = useState(null);
  const [atividades, setAtividades] = useState(null);
  const [concluidas, setConcluidas] = useState([]);
  const [erro, setErro] = useState('');

  // Carregamento das atividades e do progresso da etapa
  const carregar = useCallback(() => {
    setErro('');
    buscarAtividadesDaEtapa(chaveEtapa)
      .then(async (dados) => {
        const status = await buscarStatusEtapa(dados.etapa_id);
        setEtapaId(dados.etapa_id);
        setAtividades(dados.atividades);
        setConcluidas(status.atividades.filter((atividade) => atividade.realizada).map((atividade) => atividade.chave));

        // Recupera etapa concluída que ainda não avançou
        if (status.concluida) {
          const resumo = await buscarResumoProgresso();
          const etapa = resumo.etapas.find((item) => item.etapa_id === dados.etapa_id);
          if (etapa?.situacao === 'atual') {
            const resultado = await concluirEtapa(dados.etapa_id);
            if (resultado.avancou || resultado.concluida) {
              window.dispatchEvent(new Event('progresso-atualizado'));
            }
          }
        }
      })
      .catch(() => setErro('Não foi possível carregar as atividades. Verifique a conexão e tente de novo.'));
  }, [chaveEtapa]);

  useEffect(carregar, [carregar]);

  const atividadeId = (chave) => atividades?.find((atividade) => atividade.chave === chave)?.activity_id;

  // Confirmação da atividade e avanço da trilha
  async function concluir(chave) {
    const concluidasAgora = concluidas.includes(chave) ? concluidas : [...concluidas, chave];
    setConcluidas(concluidasAgora);

    // Confirma todas as atividades obrigatórias antes do avanço
    const obrigatorias = (atividades ?? []).filter((atividade) => atividade.obrigatoria);
    const terminouObrigatorias = obrigatorias.length > 0
      && obrigatorias.every((atividade) => concluidasAgora.includes(atividade.chave));

    if (!terminouObrigatorias || !etapaId) return;

    try {
      for (let tentativa = 0; tentativa < 5; tentativa += 1) {
        const resumo = await buscarResumoProgresso();
        const etapa = resumo.etapas.find((item) => item.etapa_id === etapaId);

        // Atualiza a tela se o servidor já avançou a etapa
        if (etapa?.situacao === 'concluida') {
          window.dispatchEvent(new Event('progresso-atualizado'));
          return;
        }

        if (etapa?.situacao === 'atual' && etapa.percentual === 100) {
          const resultado = await concluirEtapa(etapaId);
          if (resultado.avancou || resultado.concluida) {
            window.dispatchEvent(new Event('progresso-atualizado'));
          }
          return;
        }

        // Aguarda o registro da última resposta
        await new Promise((resolve) => window.setTimeout(resolve, 350));
      }
      throw new Error('A resposta final não foi confirmada a tempo.');
    } catch (falha) {
      console.error('Não foi possível atualizar o progresso da etapa.', falha);
    }
  }

  return { atividades, concluidas, erro, carregar, atividadeId, concluir };
}
