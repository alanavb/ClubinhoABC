import { useState } from 'react';
import { criarAlternativas, falar, palavrasDoAlfabeto, sortear } from '../alfabeto';
import { registrarResultado } from '../../utils/resultados';
import FeedbackResposta from './FeedbackResposta';

const totalRodadas = 3;

export default function Prova({ aoConcluir, aoFechar }) {
  const criarRodada = () => {
    const desafio = sortear(palavrasDoAlfabeto);
    return { ...desafio, alternativas: criarAlternativas(desafio.letra) };
  };
  const [rodada, setRodada] = useState(1);
  const [desafio, setDesafio] = useState(criarRodada);
  const [retorno, setRetorno] = useState('');

  function responder(letra) {
    if (retorno === 'correct') return;
    falar(letra);
    const correta = letra === desafio.letra;
    registrarResultado('bonus', letra, desafio.letra);
    if (correta) {
      setRetorno('correct');
      window.setTimeout(avancarRodada, 800);
      return;
    }
    setRetorno('incorrect');
  }

  function avancarRodada() {
    if (rodada === totalRodadas) { aoConcluir(); aoFechar(); return; }
    setRodada((atual) => atual + 1);
    setDesafio(criarRodada());
    setRetorno('');
  }

  return <section className="game-session" aria-live="polite"><div className="game-session-card word-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Fechar atividade">×</button>
    <span>DESAFIO BÔNUS</span><small className="game-round">Pergunta {rodada} de {totalRodadas}</small><h2>Prova das Letras</h2><p>Toque na figura para ouvir a palavra e escolha a letra inicial.</p>
    <button className="word-picture" type="button" onClick={() => falar(desafio.palavra)} aria-label={`Ouvir a palavra ${desafio.palavra}`}><i aria-hidden="true">{desafio.icone}</i><i className="sound-badge" aria-hidden="true">🔊</i></button>
    <div className="letter-options">{desafio.alternativas.map((letra) => <button type="button" onClick={() => responder(letra)} key={letra}>{letra}</button>)}</div>
    <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && rodada === totalRodadas} />}</div>
  </div></section>;
}
