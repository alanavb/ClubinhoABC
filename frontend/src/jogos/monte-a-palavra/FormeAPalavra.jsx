import { useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

const rodadas = [
  { palavra: 'BOLA', silabas: ['BO', 'LA'], extra: 'CA', icone: '⚽' },
  { palavra: 'CASA', silabas: ['CA', 'SA'], extra: 'PO', icone: '🏠' },
  { palavra: 'MACACO', silabas: ['MA', 'CA', 'CO'], extra: 'LU', icone: '🐒' },
];

const opcoesDaRodada = (rodada) => embaralhar([...rodada.silabas, rodada.extra]);

export default function FormeAPalavra({ atividadeId, aoConcluir, aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [opcoes, setOpcoes] = useState(() => opcoesDaRodada(rodadas[0]));
  const [montada, setMontada] = useState([]);
  const [retorno, setRetorno] = useState('');
  const rodada = rodadas[indice];
  const ultima = indice === rodadas.length - 1;

  function escolher(silaba) {
    if (retorno === 'correct') return;
    falar(silaba);
    const proxima = [...montada, silaba];
    if (proxima.length < rodada.silabas.length) {
      setMontada(proxima);
      setRetorno('');
      return;
    }
    const resposta = proxima.join('');
    if (resposta === rodada.palavra) {
      setMontada(proxima);
      setRetorno('correct');
      falar(rodada.palavra);
      if (ultima) registrarResultadoPorId(atividadeId, resposta, rodada.palavra);
      window.setTimeout(avancar, 800);
    } else {
      registrarResultadoPorId(atividadeId, resposta, rodada.palavra);
      setMontada([]);
      setRetorno('incorrect');
    }
  }

  function avancar() {
    if (ultima) { aoConcluir(); return; }
    setIndice(indice + 1);
    setOpcoes(opcoesDaRodada(rodadas[indice + 1]));
    setMontada([]);
    setRetorno('');
  }

  return <section className="game-session" aria-live="polite"><div className="game-session-card word-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>FASE 1 · FORME A PALAVRA</span><small className="game-round">Palavra {indice + 1} de {rodadas.length}</small>
    <h2>Monte a palavra</h2><p>Toque na figura para ouvir. Depois, toque nas sílabas na ordem certa.</p>
    <button className="word-picture" type="button" onClick={() => falar(rodada.palavra)} aria-label={`Ouvir a palavra ${rodada.palavra}`}><i aria-hidden="true">{rodada.icone}</i><i className="sound-badge" aria-hidden="true">🔊</i></button>
    <div className="missing-sentence syllable-slots" aria-label={`Palavra montada: ${montada.join('') || 'vazia'}`}>
      {rodada.silabas.map((_, posicao) => montada[posicao] ? <b key={posicao}>{montada[posicao]}</b> : <i key={posicao}>?</i>)}
    </div>
    <div className="letter-options syllable-options">{opcoes.map((silaba) => <button type="button" key={silaba} onClick={() => escolher(silaba)}>{silaba}</button>)}</div>
    <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && ultima} />}</div>
  </div></section>;
}
