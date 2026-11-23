import { useState } from 'react';
import { embaralhar, letras } from '../alfabeto';
import { registrarResultadoPorId } from '../../utils/resultados';
import FeedbackResposta from './FeedbackResposta';

// Número de rodadas do jogo da memória
const totalRodadas = 3;

// Criação dos pares de letras de uma rodada
function criarRodada() {
  const escolhidas = embaralhar(letras).slice(0, 3);
  return embaralhar(escolhidas.flatMap((letra) => [{ par: letra, valor: letra }, { par: letra, valor: letra.toLowerCase() }]));
}

// Jogo de associação entre letras maiúsculas e minúsculas
export default function JogoDaMemoria({ atividadeId, aoConcluir, aoFechar }) {
  const [rodada, setRodada] = useState(1);
  const [cartas, setCartas] = useState(criarRodada);
  const [abertas, setAbertas] = useState([]);
  const [encontradas, setEncontradas] = useState([]);
  const [retorno, setRetorno] = useState('');

  // Validação do par de cartas escolhido
  function escolherCarta(indice) {
    if (encontradas.includes(indice) || abertas.includes(indice) || abertas.length === 2) return;
    const proximasAbertas = [...abertas, indice];
    setAbertas(proximasAbertas);
    if (proximasAbertas.length !== 2) { setRetorno(''); return; }
    const [primeira, segunda] = proximasAbertas;
    const correta = cartas[primeira].par === cartas[segunda].par;
    if (correta) {
      setRetorno('correct');
      const proximasEncontradas = [...encontradas, primeira, segunda];
      setEncontradas(proximasEncontradas);
      setAbertas([]);
      const concluiuRodada = proximasEncontradas.length === cartas.length;
      registrarResultadoPorId(atividadeId, cartas[segunda].par, cartas[primeira].par, concluiuRodada && rodada === totalRodadas);
      if (concluiuRodada) {
        window.setTimeout(avancarRodada, 800);
      }
      return;
    }
    registrarResultadoPorId(atividadeId, cartas[segunda].par, cartas[primeira].par);
    setRetorno('incorrect');
    window.setTimeout(() => setAbertas([]), 700);
  }

  // Verificação de todos os pares encontrados
  const rodadaConcluida = encontradas.length === cartas.length;
  // Avanço para uma nova rodada
  function avancarRodada() {
    if (rodada === totalRodadas) { aoConcluir(); aoFechar(); return; }
    setRodada((atual) => atual + 1);
    setCartas(criarRodada());
    setAbertas([]);
    setEncontradas([]);
    setRetorno('');
  }

  return <section className="game-session" aria-live="polite"><div className="game-session-card memory-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Fechar atividade">×</button>
    <span>ATIVIDADE 3</span><small className="game-round">{rodada} de {totalRodadas}</small><h2>Jogo da memória</h2><p>Encontre os pares das letras.</p>
    <div className="memory-board">{cartas.map((carta, indice) => { const revelada = abertas.includes(indice) || encontradas.includes(indice); return <button className={[(revelada ? 'revealed' : ''), (encontradas.includes(indice) ? 'matched' : '')].join(' ')} type="button" onClick={() => escolherCarta(indice)} disabled={encontradas.includes(indice)} key={carta.par + '-' + indice}>{revelada ? carta.valor : '?'}</button>; })}</div>
    <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={rodadaConcluida} />}</div>
  </div></section>;
}
