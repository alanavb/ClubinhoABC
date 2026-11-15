import { useCallback, useEffect, useState } from 'react';
import { buscarAtividadesDaEtapa, buscarResumoProgresso, buscarStatusEtapa, concluirEtapa } from '../utils/etapas';

// Carrega do banco as atividades de uma etapa e quais a criança já acertou (RN3).
// Os IDs vêm da API pela chave da atividade, então não ficam fixos no front.
export function useEtapa(chaveEtapa) {
  const [etapaId, setEtapaId] = useState(null);
  const [atividades, setAtividades] = useState(null);
  const [concluidas, setConcluidas] = useState([]);
  const [erro, setErro] = useState('');

  const carregar = useCallback(() => {
    setErro('');
    buscarAtividadesDaEtapa(chaveEtapa)
      .then(async (dados) => {
        const status = await buscarStatusEtapa(dados.etapa_id);
        setEtapaId(dados.etapa_id);
        setAtividades(dados.atividades);
        setConcluidas(status.atividades.filter((atividade) => atividade.realizada).map((atividade) => atividade.chave));

        // Recupera etapas concluídas antes desta correção: elas já têm todos
        // os acertos salvos, mas podem ter ficado como "atual" se a requisição
        // de avanço aconteceu antes do último resultado chegar ao servidor.
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

  async function concluir(chave) {
    const concluidasAgora = concluidas.includes(chave) ? concluidas : [...concluidas, chave];
    setConcluidas(concluidasAgora);

    // A última resposta pode ainda estar viajando até a API quando o jogo chama
    // esta função. Só pedimos o avanço quando o próprio servidor já confirma
    // todas as obrigatórias; isso evita deixar a etapa em 100% sem liberar a próxima.
    const obrigatorias = (atividades ?? []).filter((atividade) => atividade.obrigatoria);
    const terminouObrigatorias = obrigatorias.length > 0
      && obrigatorias.every((atividade) => concluidasAgora.includes(atividade.chave));

    if (!terminouObrigatorias || !etapaId) return;

    try {
      for (let tentativa = 0; tentativa < 5; tentativa += 1) {
        const resumo = await buscarResumoProgresso();
        const etapa = resumo.etapas.find((item) => item.etapa_id === etapaId);

        // O back-end mais recente já pode ter avançado automaticamente ao
        // gravar a resposta final. Nesse caso, apenas atualizamos a tela.
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

        // Dá tempo para a requisição que registrou a última resposta terminar.
        await new Promise((resolve) => window.setTimeout(resolve, 350));
      }
      throw new Error('A resposta final não foi confirmada a tempo.');
    } catch (falha) {
      console.error('Não foi possível atualizar o progresso da etapa.', falha);
    }
  }

  return { atividades, concluidas, erro, carregar, atividadeId, concluir };
}
