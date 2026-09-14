import { useEffect, useState } from 'react';
import OuvirEEscolher from './caca-as-letras/OuvirEEscolher';
import ComQualLetraComeca from './caca-as-letras/ComQualLetraComeca';
import JogoDaMemoria from './caca-as-letras/JogoDaMemoria';
import { buscarAtividadesAcessiveis, buscarStatusEtapa } from '../utils/etapas';
import Prova from './caca-as-letras/Prova';

const ETAPA_ATUAL_ID = 1; // id da etapa "Caça às Letras" criado por backend/seeds.py

export default function CacaAsLetras({ Cabecalho, onNavigate }) {
  const [concluidas, setConcluidas] = useState([]);
  const [atividadeAberta, setAtividadeAberta] = useState(null);
  const [chavesAcessiveis, setChavesAcessiveis] = useState(null); // RN1
  const [etapaConcluida, setEtapaConcluida] = useState(false); // RN3
  const quantidade = concluidas.length;
  const feita = (atividade) => concluidas.includes(atividade);
  const concluir = (atividade) => setConcluidas((atuais) => atuais.includes(atividade) ? atuais : [...atuais, atividade]);

  useEffect(() => {
    buscarAtividadesAcessiveis()
      .then((dados) => setChavesAcessiveis(dados.atividades.map((atividade) => atividade.chave)))
      .catch((erro) => console.error('RN1: não foi possível carregar as atividades da etapa atual.', erro));
  }, []);

  useEffect(() => {
    buscarStatusEtapa(ETAPA_ATUAL_ID)
      .then((status) => setEtapaConcluida(status.concluida))
      .catch((erro) => console.error('RN3: não foi possível verificar a conclusão da etapa.', erro));
  }, [concluidas]);

  const atividades = [
    ['ouvir', '🎧', 'Ouça e escolha', 'ouvir', true],
    ['palavra', '⚽', 'Com qual letra começa?', 'palavra', feita('ouvir')],
    ['memoria', '🧩', 'Jogo da memória', 'memoria', feita('palavra')],
    ['bonus', '💎', 'Desafio Bônus', 'bonus', true],
  ].filter(([, , , chave]) => chavesAcessiveis === null || chavesAcessiveis.includes(chave)); // RN1

  return <main className="app-shell"><Cabecalho active="jogos" onNavigate={onNavigate} />
    <section className="page-content games-page games-journey-page">
      <div className="games-heading"><img src="/images/ilustra-jogos.png" alt="" /><div><span>★ Minha trilha</span><h1>Vamos jogar!</h1></div><div className="games-stage-indicator"><b>Etapa 1</b><small>{quantidade}/3</small><i style={{ '--stage-progress': `${(quantidade / 3) * 100}%` }}><em /></i></div></div>
      <section className="games-world-trail" aria-label="Jogos da trilha de alfabetização"><article className="world-card available"><div className="world-icon">🔤</div><strong>Caça às Letras</strong><small>A · B · C</small><span>{quantidade > 0 ? '★' : '☆'} {quantidade > 1 ? '★' : '☆'} {quantidade > 2 ? '★' : '☆'}</span></article><article className={`world-card ${etapaConcluida ? 'available' : 'locked'}`}><div className="world-icon">{etapaConcluida ? '🧩' : '🔒'}</div><strong>Monte a Palavra</strong><small>{etapaConcluida ? 'Disponível' : '???'}</small><span>☆ ☆ ☆</span></article><article className="world-card locked"><div className="world-icon">🔒</div><strong>Ouça e Escolha</strong><small>???</small><span>☆ ☆ ☆</span></article><article className="world-card locked"><div className="world-icon">🔒</div><strong>Leia e Descubra</strong><small>???</small><span>☆ ☆ ☆</span></article></section>
      <section className="current-world" aria-labelledby="current-world-title"><header><div className="current-world-title"><span>🔤</span><div><small>ETAPA 1</small><h2 id="current-world-title">Caça às Letras</h2></div></div><b>✣ {quantidade}/3</b></header><div className="current-activities">{atividades.map(([id, icone, titulo, chave, disponivel]) => <article className={`activity-tile ${feita(id) ? 'done' : disponivel ? 'open' : 'blocked'}`} key={id}><span className="tile-icon">{disponivel ? icone : '🔒'}</span><h3>{titulo}</h3>{feita(id) ? <small>✓ Feito!</small> : disponivel ? <button type="button" onClick={() => setAtividadeAberta(chave)}>▶ &nbsp; Jogar</button> : <small>🔒</small>}</article>)}</div></section>
      {atividadeAberta === 'ouvir' && <OuvirEEscolher aoConcluir={() => concluir('ouvir')} aoFechar={() => setAtividadeAberta(null)} />}
      {atividadeAberta === 'palavra' && <ComQualLetraComeca aoConcluir={() => concluir('palavra')} aoFechar={() => setAtividadeAberta(null)} />}
      {atividadeAberta === 'memoria' && <JogoDaMemoria aoConcluir={() => concluir('memoria')} aoFechar={() => setAtividadeAberta(null)} />}
      {atividadeAberta === 'bonus' && <Prova aoConcluir={() => concluir('bonus')} aoFechar={() => setAtividadeAberta(null)} />}
      <p className="games-journey-note"><span>{etapaConcluida ? '⭐' : '🔒'}</span>{etapaConcluida ? 'Etapa concluída! O próximo mundo está disponível.' : 'Complete as 3 atividades para abrir o próximo mundo!'}</p>
    </section>
  </main>;
}
