import { useState } from 'react';
import { criarAlternativas, falar, palavrasDoAlfabeto, sortear } from '../alfabeto';
import { registrarResultado } from '../../utils/resultados';

const totalRodadas = 3;

export default function ComQualLetraComeca({ aoConcluir, aoFechar }) {
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
    registrarResultado('palavra', letra, desafio.letra);
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
    <span>ATIVIDADE 2</span><small className="game-round">Rodada {rodada} de {totalRodadas}</small><h2>Com qual letra começa?</h2><p>Ouça a palavra e escolha sua letra inicial.</p>
    <button className="word-picture" type="button" onClick={() => falar(desafio.palavra)} aria-label={`Ouvir a palavra ${desafio.palavra}`}><i aria-hidden="true">{desafio.icone}</i><small>{desafio.palavra.toUpperCase()}</small><i className="sound-badge" aria-hidden="true">🔊</i></button>
    <div className="letter-options">{desafio.alternativas.map((letra) => <button type="button" onClick={() => responder(letra)} key={letra}>{letra}</button>)}</div>
    {retorno === 'incorrect' && <div className="game-feedback incorrect">Quase! Ouça as letras e tente novamente.</div>}
    {retorno === 'correct' && <div className="game-feedback correct">{rodada === totalRodadas ? 'Muito bem! Você concluiu as 3 rodadas.' : 'Muito bem! Vamos para a próxima rodada.'}</div>}
  </div></section>;
}
