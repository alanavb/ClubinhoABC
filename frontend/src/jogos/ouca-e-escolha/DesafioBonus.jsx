import { useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

const desafios = [
  {
    historia: 'No sábado, Sofia levou um livro azul para ler no parque. Depois, ela sentou perto de uma árvore.',
    pergunta: 'O que Sofia levou para o parque?',
    resposta: 'Um livro azul.',
    opcoes: ['Um livro azul.', 'Um guarda-chuva amarelo.', 'Uma bola vermelha.'],
  },
  {
    historia: 'Quando o céu escureceu, João pegou o guarda-chuva e chamou sua irmã para entrar em casa.',
    pergunta: 'Por que João pegou o guarda-chuva?',
    resposta: 'Porque ia chover.',
    opcoes: ['Porque ia chover.', 'Porque queria brincar.', 'Porque o sol apareceu.'],
  },
  {
    historia: 'Na feira, Ana escolheu maçãs e bananas para o lanche. Em casa, ela dividiu as frutas com o irmão.',
    pergunta: 'Com quem Ana dividiu as frutas?',
    resposta: 'Com o irmão.',
    opcoes: ['Com o irmão.', 'Com a professora.', 'Com o cachorro.'],
  },
];

export default function DesafioBonus({ atividadeId, aoConcluir, aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [retorno, setRetorno] = useState('');
  const desafio = desafios[indice];

  function responder(resposta) {
    if (retorno === 'correct') return;
    falar(resposta);
    if (atividadeId) registrarResultadoPorId(atividadeId, resposta, desafio.resposta);
    setRetorno(resposta === desafio.resposta ? 'correct' : 'incorrect');
  }

  function avancar() {
    if (indice === desafios.length - 1) { aoConcluir(); return; }
    setIndice((atual) => atual + 1);
    setRetorno('');
  }

  return <section className="game-session sound-stage desafio-bonus" aria-live="polite"><div className="game-session-card sound-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>DESAFIO BÔNUS · DETETIVE DE HISTÓRIAS</span><small className="game-round">Caso {indice + 1} de {desafios.length}</small>
    <h2>Encontre a pista certa</h2>
    <div className="detective-step"><small>1 · OUÇA A HISTÓRIA</small><div className="detective-story"><button type="button" onClick={() => falar(desafio.historia)}>🔊 Ouvir história</button></div></div>
    <section className="detective-question"><small>2 · LEIA A PERGUNTA</small><h3>{desafio.pergunta}</h3></section>
    <section className="detective-answers"><small>3 · ESCOLHA UMA RESPOSTA</small><div className="clue-options">{embaralhar(desafio.opcoes).map((opcao) => <button type="button" key={opcao} onClick={() => responder(opcao)}>{opcao}</button>)}</div></section>
    <div className="feedback-slot">{retorno && <><FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && indice === desafios.length - 1} />{retorno === 'correct' && <button className="next-sound-round" type="button" onClick={avancar}>{indice === desafios.length - 1 ? 'Concluir bônus' : 'Próximo caso →'}</button>}</>}</div>
  </div></section>;
}
