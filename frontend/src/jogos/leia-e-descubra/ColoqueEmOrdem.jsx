import { useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

// Frases na sequência correta da história
const rodadas = [
  { titulo: 'A florzinha', frases: ['Duda plantou uma semente.', 'Duda regou a terra.', 'Nasceu uma flor.'] },
  { titulo: 'A manhã do João', frases: ['O dia amanheceu.', 'João escovou os dentes.', 'João foi para a escola.'] },
  { titulo: 'O bolo da mamãe', frases: ['Mamãe fez a massa do bolo.', 'O bolo foi para o forno.', 'A família comeu o bolo.'] },
];

const frasesEmbaralhadas = (rodada) => embaralhar(rodada.frases.map((frase, indice) => ({ numero: indice + 1, frase })));
const ordemCerta = (rodada) => rodada.frases.map((_, indice) => indice + 1).join('-'); // ex.: "1-2-3"
const momentos = ['Primeiro', 'Depois', 'Por último'];

export default function ColoqueEmOrdem({ atividadeId, aoConcluir, aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [opcoes, setOpcoes] = useState(() => frasesEmbaralhadas(rodadas[0]));
  const [escolhidas, setEscolhidas] = useState([]); // na ordem em que a criança tocou
  const [retorno, setRetorno] = useState('');
  const rodada = rodadas[indice];
  const ultima = indice === rodadas.length - 1;

function escolher({ numero, frase }) {
    if (retorno === 'correct' || escolhidas.includes(numero)) return;
    const proximas = [...escolhidas, numero];
    if (proximas.length < rodada.frases.length) {
      falar(frase);
      setEscolhidas(proximas);
      setRetorno('');
      return;
    }
    // Valida a sequência após a última escolha
    const resposta = proximas.join('-');
    if (resposta === ordemCerta(rodada)) {
      setEscolhidas(proximas);
      setRetorno('correct');
      if (ultima) registrarResultadoPorId(atividadeId, resposta, ordemCerta(rodada));
      falar(frase, 1, avancar);
    } else {
      falar(frase);
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

  return <section className="game-session sound-stage order-game-session" aria-live="polite"><div className="game-session-card sound-session order-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>FASE 3 · COLOQUE EM ORDEM</span><small className="game-round">{indice + 1} de {rodadas.length}</small>
    <h2>Organize a história</h2><p>Qual frase aconteceu primeiro? Toque nas frases na ordem em que aconteceram.</p>
    <div className="order-sequence" aria-label="Sua sequência da história">
      <small>SUA SEQUÊNCIA</small>
      <div>{rodada.frases.map((_, lugar) => escolhidas[lugar]
        ? <p key={lugar}><span>{lugar + 1}</span><b>{momentos[lugar]}: {rodada.frases[escolhidas[lugar] - 1]}</b></p>
        : <p key={lugar} className="order-empty"><span>{lugar + 1}</span><em>{momentos[lugar]}</em></p>)}</div>
    </div>
    <div className="sentence-signs order-options">{opcoes.map((opcao) => <button type="button" key={opcao.numero} disabled={escolhidas.includes(opcao.numero)} onClick={() => escolher(opcao)}><b>{opcao.frase}</b></button>)}</div>
    <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && ultima} />}</div>
  </div></section>;
}
