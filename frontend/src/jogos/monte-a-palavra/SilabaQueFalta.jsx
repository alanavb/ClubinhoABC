import { useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

const rodadas = [
  { palavra: 'GATO', partes: ['', 'TO'], resposta: 'GA', opcoes: ['GA', 'PA', 'LU'], icone: '🐱' },
  { palavra: 'LUA', partes: ['LU', ''], resposta: 'A', opcoes: ['A', 'O', 'E'], icone: '🌙' },
  { palavra: 'SAPATO', partes: ['SA', 'TO'], resposta: 'PA', opcoes: ['PA', 'BO', 'MI'], icone: '👟' },
];

export default function SilabaQueFalta({ atividadeId, aoConcluir, aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [opcoes, setOpcoes] = useState(() => embaralhar(rodadas[0].opcoes));
  const [retorno, setRetorno] = useState('');
  const rodada = rodadas[indice];
  const ultima = indice === rodadas.length - 1;

  function responder(silaba) {
    if (retorno === 'correct') return;
    falar(silaba);
    const correta = silaba === rodada.resposta;
    setRetorno(correta ? 'correct' : 'incorrect');
    if (correta) {
      if (ultima) registrarResultadoPorId(atividadeId, silaba, rodada.resposta);
      window.setTimeout(avancar, 800);
    } else {
      registrarResultadoPorId(atividadeId, silaba, rodada.resposta);
    }
  }

  function avancar() {
    if (ultima) { aoConcluir(); return; }
    setIndice(indice + 1);
    setOpcoes(embaralhar(rodadas[indice + 1].opcoes));
    setRetorno('');
  }

  const [antes, depois] = rodada.partes;
  return <section className="game-session" aria-live="polite"><div className="game-session-card word-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>FASE 2 · QUAL SÍLABA FALTA?</span><small className="game-round">Palavra {indice + 1} de {rodadas.length}</small>
    <h2>Complete a palavra</h2><p>Ouça a palavra e escolha o pedacinho que está faltando.</p>
    <button className="sentence-clue" type="button" onClick={() => falar(rodada.palavra)}>🔊 Ouvir a palavra</button>
    <div className="missing-sentence syllable-slots">
      <span aria-hidden="true">{rodada.icone}</span>
      {antes && <b>{antes}</b>}<i>{retorno === 'correct' ? rodada.resposta : '?'}</i>{depois && <b>{depois}</b>}
    </div>
    <div className="letter-options syllable-options">{opcoes.map((silaba) => <button type="button" key={silaba} onClick={() => responder(silaba)}>{silaba}</button>)}</div>
    <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && ultima} />}</div>
  </div></section>;
}
