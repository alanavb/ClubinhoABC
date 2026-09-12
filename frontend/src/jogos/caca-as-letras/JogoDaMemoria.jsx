import { useState } from 'react';
import { embaralhar, letras } from '../alfabeto';

const totalRodadas = 3;

function criarRodada() {
  const escolhidas = embaralhar(letras).slice(0, 3);
  return embaralhar(escolhidas.flatMap((letra) => [{ par: letra, valor: letra }, { par: letra, valor: letra.toLowerCase() }]));
}

export default function JogoDaMemoria({ aoConcluir, aoFechar }) {
  const [rodada, setRodada] = useState(1);
  const [cartas, setCartas] = useState(criarRodada);
  const [abertas, setAbertas] = useState([]);
  const [encontradas, setEncontradas] = useState([]);

  function escolherCarta(indice) {
    if (encontradas.includes(indice) || abertas.includes(indice) || abertas.length === 2) return;
    const proximasAbertas = [...abertas, indice];
    setAbertas(proximasAbertas);
    if (proximasAbertas.length !== 2) return;
    const [primeira, segunda] = proximasAbertas;
    if (cartas[primeira].par === cartas[segunda].par) {
      const proximasEncontradas = [...encontradas, primeira, segunda];
      setEncontradas(proximasEncontradas);
      setAbertas([]);
      if (proximasEncontradas.length === cartas.length) window.setTimeout(avancarRodada, 800);
      return;
    }
    window.setTimeout(() => setAbertas([]), 700);
  }

  const rodadaConcluida = encontradas.length === cartas.length;
  function avancarRodada() {
    if (rodada === totalRodadas) { aoConcluir(); aoFechar(); return; }
    setRodada((atual) => atual + 1);
    setCartas(criarRodada());
    setAbertas([]);
    setEncontradas([]);
  }

  return <section className="game-session" aria-live="polite"><div className="game-session-card memory-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Fechar atividade">×</button>
    <span>ATIVIDADE 3</span><small className="game-round">Rodada {rodada} de {totalRodadas}</small><h2>Jogo da memória</h2><p>Encontre os pares das letras.</p>
    <div className="memory-board">{cartas.map((carta, indice) => { const revelada = abertas.includes(indice) || encontradas.includes(indice); return <button className={[(revelada ? 'revealed' : ''), (encontradas.includes(indice) ? 'matched' : '')].join(' ')} type="button" onClick={() => escolherCarta(indice)} disabled={encontradas.includes(indice)} key={carta.par + '-' + indice}>{revelada ? carta.valor : '?'}</button>; })}</div>
    {rodadaConcluida && <div className="game-feedback correct">{rodada === totalRodadas ? 'Muito bem! Você concluiu as 3 rodadas.' : 'Muito bem! Vamos para a próxima rodada.'}</div>}
  </div></section>;
}
