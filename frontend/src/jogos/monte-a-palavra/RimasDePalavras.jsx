import { useState } from 'react';
import { falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

// Cada linha traz uma rima clara para comparar o final das palavras.
const desafios = [
  { palavra: 'GATO', icone: '🐱', resposta: 'PATO', opcoes: ['PATO', 'BARCO', 'BOLA'] },
  { palavra: 'PANELA', icone: '🍳', resposta: 'JANELA', opcoes: ['SERRA', 'JANELA', 'ABELHA'] },
  { palavra: 'ABELHA', icone: '🐝', resposta: 'OVELHA', opcoes: ['AREIA', 'OVELHA', 'GATO'] },
  { palavra: 'BOCA', icone: '👄', resposta: 'TOCA', opcoes: ['PULO', 'TOCA', 'GOTA'] },
  { palavra: 'MÃO', icone: '✋', resposta: 'PÃO', opcoes: ['BOLA', 'PÃO', 'LUA'] },
];

export default function RimasDePalavras({ atividadeId, aoConcluir, aoFechar }) {
  const [acertos, setAcertos] = useState([]);
  const [erro, setErro] = useState(false);
  const [concluido, setConcluido] = useState(false);

  function responder(indice, opcao) {
    // Depois de acertar, a linha vira um espaço de prática: qualquer opção
    // ainda pode ser ouvida sem mudar o resultado já registrado.
    if (acertos.includes(indice)) {
      falar(opcao);
      return;
    }
    falar(opcao);
    const desafio = desafios[indice];
    if (opcao !== desafio.resposta) {
      setErro(true);
      registrarResultadoPorId(atividadeId, opcao, desafio.resposta);
      return;
    }

    setErro(false);
    const novosAcertos = [...acertos, indice];
    setAcertos(novosAcertos);
    if (novosAcertos.length === desafios.length) {
      setConcluido(true);
      registrarResultadoPorId(atividadeId, 'rimas encontradas', 'rimas encontradas');
      aoConcluir();
    }
  }

  return <section className="game-session" aria-live="polite"><div className="game-session-card word-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>DESAFIO BÔNUS · PALAVRAS QUE RIMAM</span>
    <h2>Caça-rimas</h2><p>Ouça cada palavra e toque naquela que termina com um som parecido.</p>
    <div className="rimas-lista">{desafios.map((desafio, indice) => {
      const acertou = acertos.includes(indice);
      return <article className={`rima-linha ${acertou ? 'rima-encontrada' : ''}`} key={desafio.palavra}>
        <button className="rima-alvo" type="button" onClick={() => falar(desafio.palavra)} aria-label={`Ouvir a palavra ${desafio.palavra}`}><i aria-hidden="true">{desafio.icone}</i><b>{desafio.palavra}</b><small>🔊</small></button>
        <span>rima com</span>
        <div className="rima-opcoes">{desafio.opcoes.map((opcao) => <button className={acertou && opcao === desafio.resposta ? 'rima-certa' : ''} type="button" key={opcao} onClick={() => responder(indice, opcao)}>{opcao}</button>)}</div>
        {acertou && <strong aria-label="Rima encontrada">✓</strong>}
      </article>;
    })}</div>
    <div className="feedback-slot">{erro && <FeedbackResposta tipo="incorrect" />}{concluido && <FeedbackResposta tipo="correct" rodadaConcluida />}</div>
  </div></section>;
}
