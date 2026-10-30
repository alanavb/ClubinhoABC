import { useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

const desafios = [
  { completa: 'A bola rola.', partes: ['A bola', '.'], resposta: 'rola', opcoes: ['rola', 'mia', 'voa'], icone: '⚽' },
  { completa: 'O pato nada no lago.', partes: ['O pato', 'no lago.'], resposta: 'nada', opcoes: ['nada', 'dorme', 'pula'], icone: '🦆' },
  { completa: 'A menina rega a flor.', partes: ['A menina', 'a flor.'], resposta: 'rega', opcoes: ['rega', 'come', 'lê'], icone: '🌷' },
];

export default function CompleteAFrase({ atividadeId, aoConcluir, aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [retorno, setRetorno] = useState('');
  const desafio = desafios[indice];
  const responder = (palavra) => { if (retorno !== 'correct') { const correta = palavra === desafio.resposta; falar(palavra); setRetorno(correta ? 'correct' : 'incorrect'); if (correta) { if (indice === desafios.length - 1) registrarResultadoPorId(atividadeId, palavra, desafio.resposta); window.setTimeout(avancar, 800); } else registrarResultadoPorId(atividadeId, palavra, desafio.resposta); } };
  const avancar = () => { if (indice === desafios.length - 1) { aoConcluir(); return; } setIndice((atual) => atual + 1); setRetorno(''); };

  return <section className="game-session sound-stage complete-frase" aria-live="polite"><div className="game-session-card sound-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>FASE 2 · BALÕES DE PALAVRAS</span><small className="game-round">Desafio {indice + 1} de {desafios.length}</small>
    <h2>Qual palavra fugiu da frase?</h2><p>Ouça a frase inteira. Depois, toque no balão com a palavra que falta.</p>
    <button className="sentence-clue" type="button" onClick={() => falar(desafio.completa)}>🔊 Ouvir a frase inteira</button>
    <div className="missing-sentence"><span>{desafio.icone}</span><b>{desafio.partes[0]}</b><i>?</i><b>{desafio.partes[1]}</b></div>
    <div className="word-bubbles">{embaralhar(desafio.opcoes).map((palavra) => <button type="button" key={palavra} onClick={() => responder(palavra)}><span>{palavra}</span></button>)}</div>
    <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && indice === desafios.length - 1} />}</div>
  </div></section>;
}
