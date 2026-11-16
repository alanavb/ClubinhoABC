import { useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

// Frases e cenas usadas nas rodadas de escuta
const rodadas = [
  { frase: 'O gato dorme no tapete.', resposta: 'gato', opcoes: [{ id: 'gato', icone: '🐱', texto: 'O gato dorme no tapete.' }, { id: 'pato', icone: '🦆', texto: 'O pato nada no lago.' }, { id: 'bola', icone: '⚽', texto: 'A bola rola no chão.' }] },
  { frase: 'A fada voa perto da lua.', resposta: 'fada', opcoes: [{ id: 'fada', icone: '🧚', texto: 'A fada voa perto da lua.' }, { id: 'casa', icone: '🏠', texto: 'A casa tem uma porta azul.' }, { id: 'sol', icone: '☀️', texto: 'O sol brilha no céu.' }] },
  { frase: 'O menino come uva no lanche.', resposta: 'uva', opcoes: [{ id: 'uva', icone: '🍇', texto: 'O menino come uva no lanche.' }, { id: 'lua', icone: '🌙', texto: 'A lua aparece à noite.' }, { id: 'foca', icone: '🦭', texto: 'A foca nada no mar.' }] },
];

// Atividade de associação entre frase narrada e cena
export default function FraseECena({ atividadeId, aoConcluir, aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [retorno, setRetorno] = useState('');
  const rodada = rodadas[indice];
  // Validação da cena escolhida
  const responder = (id, texto) => { if (retorno !== 'correct') { const correta = id === rodada.resposta; setRetorno(correta ? 'correct' : 'incorrect'); if (correta) { if (indice === rodadas.length - 1) registrarResultadoPorId(atividadeId, texto, rodada.frase); falar(texto, 1, avancar); } else { falar(texto); registrarResultadoPorId(atividadeId, texto, rodada.frase); } } };
  // Avanço para a próxima cena
  const avancar = () => { if (indice === rodadas.length - 1) { aoConcluir(); return; } setIndice((atual) => atual + 1); setRetorno(''); };

  return <section className="game-session sound-stage frase-cena" aria-live="polite"><div className="game-session-card sound-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>FASE 1 · RÁDIO DAS HISTÓRIAS</span><small className="game-round">{indice + 1} de {rodadas.length}</small>
    <h2>Qual cena o rádio contou?</h2><p>Ouça a história no rádio e escolha a cena certa.</p>
    <div className="story-radio"><span aria-hidden="true">📻</span><button type="button" onClick={() => falar(rodada.frase)} aria-label="Ouvir frase">🔊 Ouvir narrador</button></div>
    <div className="scene-options">{embaralhar(rodada.opcoes).map(({ id, icone, texto }) => <button type="button" key={id} onClick={() => responder(id, texto)}><span>{icone}</span><b>{texto}</b></button>)}</div>
    <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && indice === rodadas.length - 1} />}</div>
  </div></section>;
}
