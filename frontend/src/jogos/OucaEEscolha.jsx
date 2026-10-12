import { useEffect, useState } from 'react';
import FraseECena from './ouca-e-escolha/FraseECena';
import CompleteAFrase from './ouca-e-escolha/CompleteAFrase';
import FrasesSonoras from './ouca-e-escolha/FrasesSonoras';
import DesafioBonus from './ouca-e-escolha/DesafioBonus';
import { buscarAtividadesDaEtapa } from '../utils/etapas';

const fases = [
  { id: 'cena', chave: 'frase-cena', numero: 1, icone: '📻', titulo: 'Rádio das Histórias', texto: 'Ouça uma frase curta e escolha a cena certa.', obrigatoria: true },
  { id: 'completar', chave: 'complete-frase', numero: 2, icone: '🎈', titulo: 'Balões de Palavras', texto: 'Ouça a frase e escolha a palavra que falta.', obrigatoria: true },
  { id: 'frases', chave: 'frases-sonoras', numero: 3, icone: '🚂', titulo: 'Frases Sonoras', texto: 'Ouça, leia e encontre a frase correspondente.', obrigatoria: true },
  { id: 'bonus', chave: 'bonus-ouca', numero: 'BÔNUS', icone: '🔎', titulo: 'Detetive de Histórias', texto: 'Ouça uma história maior e encontre a pista certa.', obrigatoria: false },
];

export default function OucaEEscolha() {
  const [faseAberta, setFaseAberta] = useState(null);
  const [concluidas, setConcluidas] = useState([]);
  const [atividades, setAtividades] = useState(null);
  const concluir = (id) => { setConcluidas((atuais) => atuais.includes(id) ? atuais : [...atuais, id]); setFaseAberta(null); };

  useEffect(() => {
    buscarAtividadesDaEtapa('ouca-e-escolha')
      .then((dados) => setAtividades(dados.atividades))
      .catch((erro) => console.error('Não foi possível carregar as atividades da Etapa 3.', erro));
  }, []);

  const atividadeId = (chave) => atividades?.find((atividade) => atividade.chave === chave)?.activity_id;

  if (faseAberta === 'cena') return <FraseECena atividadeId={atividadeId('frase-cena')} aoConcluir={() => concluir('cena')} aoFechar={() => setFaseAberta(null)} />;
  if (faseAberta === 'completar') return <CompleteAFrase atividadeId={atividadeId('complete-frase')} aoConcluir={() => concluir('completar')} aoFechar={() => setFaseAberta(null)} />;
  if (faseAberta === 'frases') return <FrasesSonoras atividadeId={atividadeId('frases-sonoras')} aoConcluir={() => concluir('frases')} aoFechar={() => setFaseAberta(null)} />;
  if (faseAberta === 'bonus') return <DesafioBonus atividadeId={atividadeId('bonus-ouca')} aoConcluir={() => concluir('bonus')} aoFechar={() => setFaseAberta(null)} />;

  const concluidasObrigatorias = concluidas.filter((id) => fases.find((fase) => fase.id === id)?.obrigatoria).length;

  return <section className="current-world sentence-world" aria-labelledby="ouca-escolha-title">
    <header className="sentence-world-header"><div><span>👂</span><section><small>ETAPA 3 · PRÉVIA</small><h2 id="ouca-escolha-title">Ouça e Escolha</h2><p>Frases, escuta e leitura ativa.</p></section></div><b>✦ {concluidasObrigatorias}/3</b></header>
    <div className="sentence-world-activities">{fases.map(({ id, chave, numero, icone, titulo, texto, obrigatoria }) => <article className={`sentence-phase-card ${obrigatoria ? '' : 'bonus-phase'}`} key={id}>
      <span className="sentence-phase-icon">{icone}</span><small>FASE {numero}</small><h3>{titulo}</h3><p>{texto}</p>
      {concluidas.includes(id) ? <b className="phase-done">✓ Concluída</b> : <button type="button" disabled={!atividadeId(chave) && obrigatoria} onClick={() => setFaseAberta(id)}>{atividadeId(chave) ? '▶ Jogar' : obrigatoria ? 'Carregando...' : '▶ Visualizar'}</button>}
    </article>)}</div>
    <p className="sentence-world-note">A prévia usa a voz do navegador. O registro de resultados será conectado ao back-end depois.</p>
  </section>;
}
