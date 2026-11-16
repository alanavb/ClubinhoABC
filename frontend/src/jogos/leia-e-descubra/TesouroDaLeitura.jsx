import { useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

// Histórias, perguntas e ilustrações do desafio bônus
const rodadas = [
    { 
        texto: 'Um pirata achou um mapa velho dentro de um baú. No desenho, havia uma ilha, uma palmeira e um X bem perto dela. O pirata chegou à ilha, cavou perto da palmeira e encontrou o tesouro.',
        pergunta: 'O que o pirata fez para achar o tesouro?',
        resposta: 'Cavou perto da palmeira.',
        opcoes: ['Cavou perto da palmeira.', 'Nadou até o fundo do mar.', 'Voltou para o barco.'],
        ilustracoes: ['🗺️', '🏝️', '💎'],
  },
  {
        texto: 'A bola da Luiza furou e ela ficou triste, pois queria brincar no quintal. O papai encontrou o furo e passou cola nele. Depois de esperar um pouco, a bola parou de perder ar e Luiza voltou a jogar.',
        pergunta: 'Por que Luiza conseguiu jogar de novo?',
        resposta: 'Porque a bola foi consertada.',
        opcoes: ['Porque a bola foi consertada.', 'Porque ganhou uma bola nova.', 'Porque brincou sem a bola.'],
        ilustracoes: ['⚽', '🩹', '👨'],
  },
  {
        texto: 'No jardim da escola, as crianças plantaram feijão em copinhos e escreveram seus nomes neles. Todos os dias, elas levavam água para as sementes. Depois de uma semana, cada copinho tinha uma folhinha verde.',
        pergunta: 'O que as crianças fizeram para ajudar o feijão a crescer?',
        resposta: 'Colocaram água todos os dias.',
        opcoes: ['Colocaram água todos os dias.', 'Guardaram os copinhos no armário.', 'Pintaram as sementes de verde.'],
        ilustracoes: ['🌱', '💧', '🍃'],
  },
];

// Desafio bônus de leitura e compreensão de histórias
export default function TesouroDaLeitura({ atividadeId, aoConcluir, aoFechar }) {
  const [indice, setIndice] = useState(0);
  const [opcoes, setOpcoes] = useState(() => embaralhar(rodadas[0].opcoes));
  const [retorno, setRetorno] = useState('');
  const rodada = rodadas[indice];
  const ultima = indice === rodadas.length - 1;

  // Validação da resposta escolhida
  function responder(opcao) {
    if (retorno === 'correct') return;
    const correta = opcao === rodada.resposta;
    setRetorno(correta ? 'correct' : 'incorrect');
    if (correta) {
      if (ultima) registrarResultadoPorId(atividadeId, opcao, rodada.resposta);
      falar(opcao, 1, avancar);
    } else {
      falar(opcao);
      registrarResultadoPorId(atividadeId, opcao, rodada.resposta);
    }
  }

  // Avanço para a próxima história
  function avancar() {
    if (ultima) { aoConcluir(); return; }
    setIndice(indice + 1);
    setOpcoes(embaralhar(rodadas[indice + 1].opcoes));
    setRetorno('');
  }

  return <section className="game-session sound-stage treasure-game-session" aria-live="polite"><div className="game-session-card sound-session treasure-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>DESAFIO BÔNUS · TESOURO DA LEITURA</span><small className="game-round">{indice + 1} de {rodadas.length}</small>
    <div className="treasure-scene" aria-hidden="true">{rodada.ilustracoes.map((ilustracao) => <i key={ilustracao}>{ilustracao}</i>)}</div>
    <h2>Encontre a resposta</h2><p>Leia a história e encontre a pista certa.</p>
    <article className="treasure-story"><header><small>📜 HISTÓRIA</small><button type="button" onClick={() => falar(rodada.texto)} aria-label="Ouvir a história" title="Ouvir a história">🔊</button></header><b>{rodada.texto}</b></article>
    <h3 className="treasure-question"><span>🧭</span>{rodada.pergunta}</h3>
    <div className="sentence-signs treasure-options">{opcoes.map((opcao) => <button type="button" key={opcao} onClick={() => responder(opcao)}><b>{opcao}</b></button>)}</div>
    <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && ultima} />}</div>
  </div></section>;
}
