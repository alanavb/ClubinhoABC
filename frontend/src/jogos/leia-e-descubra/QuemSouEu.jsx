import { useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

// Pistas e figuras usadas nas rodadas
const rodadas = [
  { resposta: 'pato', pistas: ['Eu tenho penas.', 'Eu nado no lago.', 'Eu faço quá!'], opcoes: [['pato', '🦆'], ['gato', '🐱'], ['vaca', '🐮']] },
  { resposta: 'bola', pistas: ['Eu sou redonda.', 'Eu rolo pelo chão.', 'As crianças me chutam.'], opcoes: [['bola', '⚽'], ['tênis', '👟'], ['Queijo', '🧀']] },
  { resposta: 'sol', pistas: ['Eu sou amarelo.', 'Eu brilho no céu.', 'Eu apareço de dia.'], opcoes: [['sol', '☀️'], ['lua', '🌙'], ['Nuvem', '☁️']] },
];

// Atividade de leitura de pistas e escolha da figura
export default function QuemSouEu({ atividadeId, aoConcluir, aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [opcoes, setOpcoes] = useState(() => embaralhar(rodadas[0].opcoes));
  const [retorno, setRetorno] = useState('');
  const rodada = rodadas[indice];
  const ultima = indice === rodadas.length - 1;

  // Validação da figura escolhida
  function responder(nome) {
    if (retorno === 'correct') return;
    const correta = nome === rodada.resposta;
    setRetorno(correta ? 'correct' : 'incorrect');
    if (correta) {
      registrarResultadoPorId(atividadeId, nome, rodada.resposta, ultima);
      falar(nome, 1, avancar);
    } else {
      falar(nome);
      registrarResultadoPorId(atividadeId, nome, rodada.resposta);
    }
  }

  // Avanço para a próxima rodada
  function avancar() {
    if (ultima) { aoConcluir(); return; }
    setIndice(indice + 1);
    setOpcoes(embaralhar(rodadas[indice + 1].opcoes));
    setRetorno('');
  }

  return <section className="game-session sound-stage" aria-live="polite"><div className="game-session-card sound-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>FASE 2 · QUEM SOU EU?</span><small className="game-round">{indice + 1} de {rodadas.length}</small>
    <div className="missing-sentence reading-note">{rodada.pistas.map((pista) => <b key={pista}>{pista}</b>)}</div>
    <button className="sentence-clue" type="button" onClick={() => falar(rodada.pistas.join(' '))}>🔊 Ouvir as pistas (se precisar)</button>
    <h2 className="quem-sou-eu-pergunta">Quem sou eu?</h2><p className="quem-sou-eu-acao">Toque na figura certa.</p>
    <div className="scene-options">{opcoes.map(([nome, icone]) => <button type="button" key={nome} onClick={() => responder(nome)} aria-label={nome}><span>{icone}</span></button>)}</div>
    <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && ultima} />}</div>
  </div></section>;
}
