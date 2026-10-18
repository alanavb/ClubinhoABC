import { useCallback, useEffect, useState } from 'react';
import { buscarAtividadesDaEtapa, buscarStatusEtapa, concluirEtapa } from '../utils/etapas';

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
      })
      .catch(() => setErro('Não foi possível carregar as atividades. Verifique a conexão e tente de novo.'));
  }, [chaveEtapa]);

  useEffect(carregar, [carregar]);

  const atividadeId = (chave) => atividades?.find((atividade) => atividade.chave === chave)?.activity_id;

  async function concluir(chave) {
    setConcluidas((atuais) => (atuais.includes(chave) ? atuais : [...atuais, chave]));
    try {
      // O back-end só avança a criança quando todas as obrigatórias da etapa têm acerto.
      const resultado = await concluirEtapa(etapaId);
      if (resultado.avancou) window.dispatchEvent(new Event('progresso-atualizado'));
    } catch (falha) {
      console.error('Não foi possível atualizar o progresso da etapa.', falha);
    }
  }

  return { atividades, concluidas, erro, carregar, atividadeId, concluir };
}
