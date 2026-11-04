import { useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

const rodadas = [
  { resposta: 'pato', pistas: ['Eu tenho penas.', 'Eu nado no lago.', 'Eu faço quá!'], opcoes: [['pato', '🦆'], ['gato', '🐱'], ['vaca', '🐮']] },
  { resposta: 'bola', pistas: ['Eu sou redonda.', 'Eu rolo pelo chão.', 'As crianças me chutam.'], opcoes: [['bola', '⚽'], ['tênis', '👟'], ['Queijo', '🧀']] },
  { resposta: 'sol', pistas: ['Eu sou amarelo.', 'Eu brilho no céu.', 'Eu apareço de dia.'], opcoes: [['sol', '☀️'], ['lua', '🌙'], ['Nuvem', '☁️']] },
];

export default function QuemSouEu({ atividadeId, aoConcluir, aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [opcoes, setOpcoes] = useState(() => embaralhar(rodadas[0].opcoes));
  const [retorno, setRetorno] = useState('');
  const rodada = rodadas[indice];
  const ultima = indice === rodadas.length - 1;

  function responder(nome) {
    if (retorno === 'correct') return;
    falar(nome);
    const correta = nome === rodada.resposta;
    setRetorno(correta ? 'correct' : 'incorrect');
    if (correta) {
      if (ultima) registrarResultadoPorId(atividadeId, nome, rodada.resposta);
      window.setTimeout(avancar, 800);
    } else {
      registrarResultadoPorId(atividadeId, nome, rodada.resposta);
    }
  }

  function avancar() {
    if (ultima) { aoConcluir(); return; }
    setIndice(indice + 1);
    setOpcoes(embaralhar(rodadas[indice + 1].opcoes));
    setRetorno('');
  }

  return <section className="game-session sound-stage" aria-live="polite"><div className="game-session-card sound-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>FASE 2 · QUEM SOU EU?</span><small className="game-round">Adivinha {indice + 1} de {rodadas.length}</small>
    <h2>Quem sou eu?</h2><p>Leia as pistas e toque na figura que combina com elas.</p>
    <div className="missing-sentence reading-note">{rodada.pistas.map((pista) => <b key={pista}>{pista}</b>)}</div>
    <button className="sentence-clue" type="button" onClick={() => falar(rodada.pistas.join(' '))}>🔊 Ouvir as pistas (se precisar)</button>
    <div className="scene-options">{opcoes.map(([nome, icone]) => <button type="button" key={nome} onClick={() => responder(nome)} aria-label={nome}><span>{icone}</span></button>)}</div>
    <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && ultima} />}</div>
  </div></section>;
}