import { useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

const rodadas = [
    { 
        texto: 'Um pirata achou um mapa velho. O mapa mostrava uma ilha com uma palmeira. O tesouro estava embaixo da palmeira.',
        pergunta: 'Onde estava o tesouro?',
        resposta: 'Embaixo da palmeira.',
        opcoes: ['Embaixo da palmeira.', 'Dentro do barco.', 'No fundo do mar.'],
  },
  {
        texto: 'A bola da Luiza furou e ela ficou triste. O papai colou o furo com cola. Agora a Luiza pode jogar de novo.',
        pergunta: 'Quem ajudou a Luiza?',
        resposta: 'O papai.',
        opcoes: ['O papai.', 'A vovó.', 'O amigo.'],
  },
  {
        texto: 'No jardim da escola, as crianças plantaram feijão em copinhos. Todo dia elas colocavam água. Depois de uma semana, nasceu uma folhinha verde.',
        pergunta: 'O que nasceu no copinho?',
        resposta: 'Uma folhinha verde.',
        opcoes: ['Uma folhinha verde.', 'Uma flor amarela.', 'Uma bola azul.'],
  },
];

export default function TesouroDaLeitura({ atividadeId, aoConcluir, aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [opcoes, setOpcoes] = useState(() => embaralhar(rodadas[0].opcoes));
  const [retorno, setRetorno] = useState('');
  const rodada = rodadas[indice];
  const ultima = indice === rodadas.length - 1;

  function responder(opcao) {
    if (retorno === 'correct') return;
    falar(opcao);
    const correta = opcao === rodada.resposta;
    setRetorno(correta ? 'correct' : 'incorrect');
    if (correta) {
      if (ultima) registrarResultadoPorId(atividadeId, opcao, rodada.resposta);
      window.setTimeout(avancar, 800);
    } else {
      registrarResultadoPorId(atividadeId, opcao, rodada.resposta);
    }
  }

  function avancar() {
    if (ultima) { aoConcluir(); return; }
    setIndice(indice + 1);
    setOpcoes(embaralhar(rodadas[indice + 1].opcoes));
    setRetorno('');
  }

  return <section className="game-session sound-stage" aria-live="polite"><div className="game-session-card sound-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>DESAFIO BÔNUS · TESOURO DA LEITURA</span><small className="game-round">Tesouro {indice + 1} de {rodadas.length}</small>
    <h2>Leia e descubra o tesouro</h2><p>Leia a história até o fim. Depois, responda à pergunta.</p>
    <div className="missing-sentence reading-note"><small>📜 História</small><b>{rodada.texto}</b></div>
    <button className="sentence-clue" type="button" onClick={() => falar(rodada.texto)}>🔊 Ouvir a história (se precisar)</button>
    <h3 className="reading-question">{rodada.pergunta}</h3>
    <div className="sentence-signs">{opcoes.map((opcao) => <button type="button" key={opcao} onClick={() => responder(opcao)}><b>{opcao}</b></button>)}</div>
    <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && ultima} />}</div>
  </div></section>;
}