import { useState } from 'react';
import { falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

// Consciência silábica: a criança ouve a palavra e conta quantos pedacinhos ela tem.
const rodadas = [
  { palavra: 'PATO', separada: 'PA - TO', silabas: '2', icone: '🦆' },
  { palavra: 'MACACO', separada: 'MA - CA - CO', silabas: '3', icone: '🐒' },
  { palavra: 'BORBOLETA', separada: 'BOR - BO - LE - TA', silabas: '4', icone: '🦋' },
];

const opcoes = ['1', '2', '3', '4'];

export default function ContarSilabas({ atividadeId, aoConcluir, aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [retorno, setRetorno] = useState('');
  const rodada = rodadas[indice];
  const ultima = indice === rodadas.length - 1;

  function responder(quantidade) {
    if (retorno === 'correct') return;
    falar(quantidade);
    const correta = quantidade === rodada.silabas;
    setRetorno(correta ? 'correct' : 'incorrect');
    if (correta) {
      if (ultima) registrarResultadoPorId(atividadeId, quantidade, rodada.silabas);
      window.setTimeout(avancar, 1500);
    } else {
      registrarResultadoPorId(atividadeId, quantidade, rodada.silabas);
    }
  }

  function avancar() {
    if (ultima) { aoConcluir(); return; }
    setIndice(indice + 1);
    setRetorno('');
  }

  return <section className="game-session" aria-live="polite"><div className="game-session-card word-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>DESAFIO BÔNUS · CONTE AS SÍLABAS</span><small className="game-round">Palavra {indice + 1} de {rodadas.length}</small>
    <h2>Quantos pedacinhos?</h2><p>Toque na figura para ouvir a palavra. Depois, conte as sílabas.</p>
    <button className="word-picture" type="button" onClick={() => falar(rodada.palavra)} aria-label={`Ouvir a palavra ${rodada.palavra}`}><i aria-hidden="true">{rodada.icone}</i><i className="sound-badge" aria-hidden="true">🔊</i></button>
    <div className="missing-sentence written-word"><b>{retorno === 'correct' ? rodada.separada : rodada.palavra}</b></div>
    <div className="letter-options">{opcoes.map((quantidade) => <button type="button" key={quantidade} onClick={() => responder(quantidade)}>{quantidade}</button>)}</div>
    <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && ultima} />}</div>
  </div></section>;
}
