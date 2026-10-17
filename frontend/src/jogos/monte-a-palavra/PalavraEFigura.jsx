import { useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

const rodadas = [
  { palavra: 'UVA', opcoes: [['UVA', '🍇'], ['PATO', '🦆'], ['LUA', '🌙']] },
  { palavra: 'FOCA', opcoes: [['FOCA', '🦭'], ['FADA', '🧚'], ['BOLA', '⚽']] },
  { palavra: 'DADO', opcoes: [['DADO', '🎲'], ['DEDO', '☝️'], ['VACA', '🐮']] },
];

export default function PalavraEFigura({ atividadeId, aoConcluir, aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [opcoes, setOpcoes] = useState(() => embaralhar(rodadas[0].opcoes));
  const [retorno, setRetorno] = useState('');
  const rodada = rodadas[indice];
  const ultima = indice === rodadas.length - 1;

  function responder(nome) {
    if (retorno === 'correct') return;
    falar(nome);
    registrarResultadoPorId(atividadeId, nome, rodada.palavra);
    setRetorno(nome === rodada.palavra ? 'correct' : 'incorrect');
  }

  function avancar() {
    if (ultima) { aoConcluir(); return; }
    setIndice(indice + 1);
    setOpcoes(embaralhar(rodadas[indice + 1].opcoes));
    setRetorno('');
  }

  return <section className="game-session sound-stage" aria-live="polite"><div className="game-session-card word-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>FASE 3 · LEIA E ENCONTRE</span><small className="game-round">Palavra {indice + 1} de {rodadas.length}</small>
    <h2>Que figura é esta palavra?</h2><p>Leia a palavra e toque na figura certa. Se precisar, ouça a palavra.</p>
    <div className="missing-sentence written-word"><b>{rodada.palavra}</b></div>
    <button className="sentence-clue" type="button" onClick={() => falar(rodada.palavra)}>🔊 Ouvir a palavra</button>
    <div className="scene-options">{opcoes.map(([nome, icone]) => <button type="button" key={nome} onClick={() => responder(nome)} aria-label={nome}><span>{icone}</span></button>)}</div>
    <div className="feedback-slot">{retorno && <><FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && ultima} />{retorno === 'correct' && <button className="next-sound-round" type="button" onClick={avancar}>{ultima ? 'Concluir fase' : 'Próxima palavra →'}</button>}</>}</div>
  </div></section>;
}
