import { useEffect, useState } from 'react';
import FraseECena from './ouca-e-escolha/FraseECena';
import CompleteAFrase from './ouca-e-escolha/CompleteAFrase';
import FrasesSonoras from './ouca-e-escolha/FrasesSonoras';
import DesafioBonus from './ouca-e-escolha/DesafioBonus';
import { buscarAtividadesDaEtapa, buscarStatusEtapa, concluirEtapa } from '../utils/etapas';

const ETAPA_ID = 3;

const fases = [
  { id: 'cena', chave: 'frase-cena', numero: 1, icone: '📻', titulo: 'Rádio das Histórias', obrigatoria: true },
  { id: 'completar', chave: 'complete-frase', numero: 2, icone: '🎈', titulo: 'Balões de Palavras', obrigatoria: true },
  { id: 'frases', chave: 'frases-sonoras', numero: 3, icone: '🚂', titulo: 'Frases Sonoras', obrigatoria: true },
  { id: 'bonus', chave: 'bonus-ouca', numero: 'BÔNUS', icone: '💎', titulo: 'Desafio Bônus', obrigatoria: false },
];

export default function OucaEEscolha() {
  const [faseAberta, setFaseAberta] = useState(null);
  const [concluidas, setConcluidas] = useState([]);
  const [atividades, setAtividades] = useState(null);

  useEffect(() => {
    Promise.all([buscarAtividadesDaEtapa('ouca-e-escolha'), buscarStatusEtapa(ETAPA_ID)])
      .then(([dados, status]) => {
        setAtividades(dados.atividades);
        const idsConcluidos = status.atividades
          .filter((atividade) => atividade.realizada)
          .map((atividade) => atividade.activity_id);
        const fasesSalvas = fases
          .filter((fase) => idsConcluidos.includes(dados.atividades.find((atividade) => atividade.chave === fase.chave)?.activity_id))
          .map((fase) => fase.id);
        setConcluidas((atuais) => [...new Set([...atuais, ...fasesSalvas])]);
      })
      .catch((erro) => console.error('Não foi possível carregar as atividades da Etapa 3.', erro));
  }, []);

  const atividadeId = (chave) => atividades?.find((atividade) => atividade.chave === chave)?.activity_id;

  async function concluir(id) {
    setConcluidas((atuais) => atuais.includes(id) ? atuais : [...atuais, id]);
    setFaseAberta(null);
    try {
      await concluirEtapa(ETAPA_ID);
    } catch (erro) {
      console.error('Não foi possível atualizar o progresso da Etapa 3.', erro);
    }
  }

  function faseDisponivel(indice) {
    const fase = fases[indice];
    if (!fase.obrigatoria || indice === 0) return true;
    return concluidas.includes(fases[indice - 1].id);
  }

  if (faseAberta === 'cena') return <FraseECena atividadeId={atividadeId('frase-cena')} aoConcluir={() => concluir('cena')} aoFechar={() => setFaseAberta(null)} />;
  if (faseAberta === 'completar') return <CompleteAFrase atividadeId={atividadeId('complete-frase')} aoConcluir={() => concluir('completar')} aoFechar={() => setFaseAberta(null)} />;
  if (faseAberta === 'frases') return <FrasesSonoras atividadeId={atividadeId('frases-sonoras')} aoConcluir={() => concluir('frases')} aoFechar={() => setFaseAberta(null)} />;
  if (faseAberta === 'bonus') return <DesafioBonus atividadeId={atividadeId('bonus-ouca')} aoConcluir={() => concluir('bonus')} aoFechar={() => setFaseAberta(null)} />;

  const concluidasObrigatorias = concluidas.filter((id) => fases.find((fase) => fase.id === id)?.obrigatoria).length;

  return <section className="current-world sentence-world" aria-labelledby="ouca-escolha-title">
    <header className="sentence-world-header"><div><span>🎧</span><section><small>ETAPA 3</small><h2 id="ouca-escolha-title">Ouça e Escolha</h2><p>Frases, escuta e leitura ativa.</p></section></div><b>⭐ {concluidasObrigatorias}/3</b></header>
    <div className="sentence-world-activities">{fases.map(({ id, chave, numero, icone, titulo, obrigatoria }, indice) => <article className={`sentence-phase-card ${obrigatoria ? '' : 'bonus-phase'} ${!faseDisponivel(indice) ? 'locked-phase' : ''}`} key={id}>
      <span className="sentence-phase-icon">{icone}</span><small>{numero === 'BÔNUS' ? numero : `FASE ${numero}`}</small><h3>{titulo}</h3>
      {concluidas.includes(id) ? <b className="phase-done">⭐ Feito!</b> : faseDisponivel(indice) && atividadeId(chave) ? <button type="button" onClick={() => setFaseAberta(id)}>▶ &nbsp; Jogar</button> : <small className="phase-locked">{atividadeId(chave) ? '🔒' : 'Carregando...'}</small>}
    </article>)}</div>
    <p className="sentence-world-note">Conclua as fases na ordem para liberar a próxima. O bônus é opcional.</p>
  </section>;
}
