import { useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

const desafios = [
  { nivel: 'Nível 1 · frase curta', resposta: 'A bola vermelha rola na grama.', opcoes: [{ frase: 'A bola vermelha rola na grama.' }, { frase: 'A bola azul rola na grama.' }, { frase: 'A bola vermelha cai na grama.' }] },
  { nivel: 'Nível 2 · frase simples', resposta: 'O gato preto pula no sofá macio.', opcoes: [{ frase: 'O gato preto pula no sofá macio.' }, { frase: 'O gato branco pula no sofá macio.' }, { frase: 'O gato preto dorme no sofá macio.' }] },
  { nivel: 'Nível 3 · frase maior', resposta: 'Depois da chuva, a menina encontrou uma borboleta azul no jardim.', opcoes: [{ frase: 'Depois da chuva, a menina encontrou uma borboleta azul no jardim.' }, { frase: 'Depois da chuva, a menina encontrou uma borboleta rosa no jardim.' }, { frase: 'Depois da chuva, a menina encontrou uma borboleta azul no parque.' }] },
];

export default function FrasesSonoras({ atividadeId, aoConcluir, aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [retorno, setRetorno] = useState('');
  const desafio = desafios[indice];
  const responder = (frase) => { if (retorno !== 'correct') { const correta = frase === desafio.resposta; falar(frase); setRetorno(correta ? 'correct' : 'incorrect'); if (correta) { if (indice === desafios.length - 1) registrarResultadoPorId(atividadeId, frase, desafio.resposta); window.setTimeout(avancar, 800); } else registrarResultadoPorId(atividadeId, frase, desafio.resposta); } };
  const avancar = () => { if (indice === desafios.length - 1) { aoConcluir(); return; } setIndice((atual) => atual + 1); setRetorno(''); };

  return <section className="game-session sound-stage frases-sonoras" aria-live="polite"><div className="game-session-card sound-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>FASE 3 · FRASES SONORAS</span><small className="game-round">{desafio.nivel}</small>
    <h2>Ouça, leia e encontre</h2><p>O trem vai ler uma frase. Leia as placas e encontre a frase que ele falou.</p>
    <div className="sentence-train"><span aria-hidden="true">🚂</span><button type="button" onClick={() => falar(desafio.resposta)}>🔊 Ouvir a frase</button><i aria-hidden="true">☁️</i></div>
    <div className="sentence-signs">{embaralhar(desafio.opcoes).map(({ frase }) => <button type="button" key={frase} onClick={() => responder(frase)}><b>{frase}</b></button>)}</div>
    <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && indice === desafios.length - 1} />}</div>
  </div></section>;
}
