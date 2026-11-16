import { useState } from 'react';
import { criarAlternativas, falar, palavrasDoAlfabeto, sortear } from '../alfabeto';
import { registrarResultadoPorId } from '../../utils/resultados';
import FeedbackResposta from './FeedbackResposta';

// Número de rodadas do desafio bônus
const totalRodadas = 3;

// Desafio de escolha da letra inicial
export default function Prova({ atividadeId, aoConcluir, aoFechar }) {
  // Criação de uma rodada com alternativas para a letra sorteada
  const criarRodada = () => {
    const desafio = sortear(palavrasDoAlfabeto);
    return { ...desafio, alternativas: criarAlternativas(desafio.letra) };
  };
  const [rodada, setRodada] = useState(1);
  const [desafio, setDesafio] = useState(criarRodada);
  const [retorno, setRetorno] = useState('');

  // Validação da letra escolhida
  function responder(letra) {
    if (retorno === 'correct') return;
    const correta = letra === desafio.letra;
    if (correta) {
      setRetorno('correct');
      if (rodada === totalRodadas) registrarResultadoPorId(atividadeId, letra, desafio.letra);
      falar(letra, 1, avancarRodada);
      return;
    }
    falar(letra);
    registrarResultadoPorId(atividadeId, letra, desafio.letra);
    setRetorno('incorrect');
  }

  // Avanço para a próxima rodada
  function avancarRodada() {
    if (rodada === totalRodadas) { aoConcluir(); aoFechar(); return; }
    setRodada((atual) => atual + 1);
    setDesafio(criarRodada());
    setRetorno('');
  }

  return <section className="game-session" aria-live="polite"><div className="game-session-card word-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Fechar atividade">×</button>
    <span>DESAFIO BÔNUS</span><small className="game-round">{rodada} de {totalRodadas}</small><h2>Prova das Letras</h2><p>Toque na figura para ouvir a palavra e escolha a letra inicial.</p>
    <button className="word-picture" type="button" onClick={() => falar(desafio.palavra)} aria-label={`Ouvir a palavra ${desafio.palavra}`}><i aria-hidden="true">{desafio.icone}</i><i className="sound-badge" aria-hidden="true">🔊</i></button>
    <div className="letter-options">{desafio.alternativas.map((letra) => <button type="button" onClick={() => responder(letra)} key={letra}>{letra}</button>)}</div>
    <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && rodada === totalRodadas} />}</div>
  </div></section>;
}
