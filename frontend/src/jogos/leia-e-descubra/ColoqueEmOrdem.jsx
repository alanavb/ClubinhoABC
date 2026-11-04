import { useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

//As frases de cada história estão escritas na ordem CERTA.
//O número de cada frase (1, 2, 3) é a posição dela nessa ordem.
const rodadas = [
  { titulo: 'A florzinha', frases: ['Duda plantou uma semente.', 'Duda regou a terra.', 'Nasceu uma flor.'] },
  { titulo: 'A manhã do João', frases: ['O dia amanheceu.', 'João escovou os dentes.', 'João foi para a escola.'] },
  { titulo: 'O bolo da mamãe', frases: ['Mamãe fez a massa do bolo.', 'O bolo foi para o forno.', 'A família comeu o bolo.'] },
];

const frasesEmbaralhadas = (rodada) => embaralhar(rodada.frases.map((frase, indice) => ({ numero: indice + 1, frase })));
const ordemCerta = (rodada) => rodada.frases.map((_, indice) => indice + 1).join('-'); // ex.: "1-2-3"

export default function ColoqueEmOrdem({ atividadeId, aoConcluir, aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [opcoes, setOpcoes] = useState(() => frasesEmbaralhadas(rodadas[0]));
  const [escolhidas, setEscolhidas] = useState([]); // números das frases, na ordem em que a criança tocou
  const [retorno, setRetorno] = useState('');
  const rodada = rodadas[indice];
  const ultima = indice === rodadas.length - 1;

function escolher({ numero, frase }) {
    if (retorno === 'correct' || escolhidas.includes(numero)) return;
    falar(frase);
    const proximas = [...escolhidas, numero];
    if (proximas.length < rodada.frases.length) {
      setEscolhidas(proximas);
      setRetorno('');
      return;
    }
    //Todas as frases foram escolhidas: confere a ordem.
    const resposta = proximas.join('-');
    if (resposta === ordemCerta(rodada)) {
      setEscolhidas(proximas);
      setRetorno('correct');
      if (ultima) registrarResultadoPorId(atividadeId, resposta, ordemCerta(rodada));
      window.setTimeout(avancar, 1200);
    } else {
      registrarResultadoPorId(atividadeId, resposta, ordemCerta(rodada));
      setEscolhidas([]);
      setRetorno('incorrect');
    }
  }

  function avancar() {
    if (ultima) { aoConcluir(); return; }
    setIndice(indice + 1);
    setOpcoes(frasesEmbaralhadas(rodadas[indice + 1]));
    setEscolhidas([]);
    setRetorno('');
  }

  return <section className="game-session sound-stage" aria-live="polite"><div className="game-session-card sound-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>FASE 3 · COLOQUE EM ORDEM</span><small className="game-round">História {indice + 1} de {rodadas.length} · {rodada.titulo}</small>
    <h2>O que aconteceu primeiro?</h2><p>Leia as frases. Toque na primeira, depois na segunda e por último na terceira.</p>
    <div className="missing-sentence reading-note" aria-label="Sua história">
      {rodada.frases.map((_, lugar) => escolhidas[lugar]
        ? <b key={lugar}>{lugar + 1}. {rodada.frases[escolhidas[lugar] - 1]}</b>
        : <i key={lugar}>{lugar + 1}</i>)}
    </div>
    <div className="sentence-signs">{opcoes.map((opcao) => <button type="button" key={opcao.numero} disabled={escolhidas.includes(opcao.numero)} onClick={() => escolher(opcao)}><b>{opcao.frase}</b></button>)}</div>
    <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && ultima} />}</div>
  </div></section>;
}