import { useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

// Cada parlenda é apresentada antes do desafio: a criança não precisa já conhecê-la.
const rodadas = [
  {
    texto: 'Hoje é domingo,\npede cachimbo.\nCachimbo é de barro,\nbate no jarro.',
    verso: 'Cachimbo é de barro, bate no ____.',
    resposta: 'JARRO',
    opcoes: ['JARRO', 'GATO', 'SOL'],
    icone: '🏺',
  },
  {
    texto: 'Um, dois,\nfeijão com arroz.\nTrês, quatro,\nfeijão no prato.',
    verso: 'Três, quatro, feijão no ____.',
    resposta: 'PRATO',
    opcoes: ['PRATO', 'SAPO', 'LIVRO'],
    icone: '🍽️',
  },
  {
    texto: 'Lá em cima do piano\ntem um copo de veneno.\nQuem bebeu, morreu.\nO culpado não fui eu.',
    verso: 'Quem bebeu, morreu. O culpado não fui ____.',
    resposta: 'EU',
    opcoes: ['EU', 'PÃO', 'MAR'],
    icone: '🎹',
  },
];

export default function DesafioDaParlenda({ atividadeId, aoConcluir, aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [aprendendo, setAprendendo] = useState(true);
  const [retorno, setRetorno] = useState('');
  const [opcoes, setOpcoes] = useState(() => embaralhar(rodadas[0].opcoes));
  const rodada = rodadas[indice];
  const ultima = indice === rodadas.length - 1;

  function iniciarDesafio() {
    setAprendendo(false);
    falar(rodada.texto);
  }

  function responder(opcao) {
    if (retorno === 'correct') return;
    falar(opcao);
    const correta = opcao === rodada.resposta;
    setRetorno(correta ? 'correct' : 'incorrect');
    if (correta) {
      if (ultima) registrarResultadoPorId(atividadeId, opcao, rodada.resposta);
      window.setTimeout(avancar, 1200);
    } else {
      registrarResultadoPorId(atividadeId, opcao, rodada.resposta);
    }
  }

  function avancar() {
    if (ultima) { aoConcluir(); return; }
    const proxima = rodadas[indice + 1];
    setIndice(indice + 1);
    setAprendendo(true);
    setRetorno('');
    setOpcoes(embaralhar(proxima.opcoes));
  }

  return <section className="game-session" aria-live="polite"><div className="game-session-card word-session parlenda-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>DESAFIO BÔNUS · PARLENDAS</span><small className="game-round">Parlenda {indice + 1} de {rodadas.length}</small>
    {aprendendo ? <>
      <h2>Vamos conhecer uma parlenda!</h2>
      <p>Parlenda é uma brincadeira de palavras com ritmo e rimas. Ouça e acompanhe.</p>
      <div className="parlenda-texto" aria-label="Texto da parlenda">{rodada.texto}</div>
      <button className="sentence-clue" type="button" onClick={() => falar(rodada.texto)}>🔊 Ouvir de novo</button>
      <button className="small-primary parlenda-start" type="button" onClick={iniciarDesafio}>Já ouvi! Vamos brincar</button>
    </> : <>
      <h2>Qual palavra faz rima?</h2>
      <p>Ouça a parlenda de novo se quiser. Depois, complete o verso.</p>
      <button className="sentence-clue" type="button" onClick={() => falar(rodada.texto)}>🔊 Ouvir a parlenda</button>
      <div className="missing-sentence parlenda-verso"><i aria-hidden="true">{rodada.icone}</i><b>{rodada.verso}</b></div>
      <div className="letter-options parlenda-options">{opcoes.map((opcao) => <button type="button" key={opcao} onClick={() => responder(opcao)}>{opcao}</button>)}</div>
      <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && ultima} />}</div>
    </>}
  </div></section>;
}
