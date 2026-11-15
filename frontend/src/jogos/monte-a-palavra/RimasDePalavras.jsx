import { useRef, useState } from 'react';
import { falar } from '../alfabeto';
import { registrarResultadoPorId } from '../../utils/resultados';

// Cada linha traz uma rima clara para comparar o final das palavras.
const rodadas = [
  [
    { palavra: 'GATO', icone: '🐱', resposta: 'PATO', opcoes: ['PATO', 'BARCO', 'BOLA'] },
    { palavra: 'PANELA', icone: '🍳', resposta: 'JANELA', opcoes: ['SERRA', 'JANELA', 'ABELHA'] },
    { palavra: 'ABELHA', icone: '🐝', resposta: 'OVELHA', opcoes: ['AREIA', 'OVELHA', 'GATO'] },
  ],
  [
    { palavra: 'CANETA', icone: '🖊️', resposta: 'BORBOLETA', opcoes: ['BORBOLETA', 'GATO', 'LUA'] },
    { palavra: 'SOL', icone: '☀️', resposta: 'CARACOL', opcoes: ['PATO', 'CARACOL', 'BOLA'] },
    { palavra: 'LEÃO', icone: '🦁', resposta: 'BALÃO', opcoes: ['BOLA', 'BALÃO', 'PATO'] },
  ],
];

export default function RimasDePalavras({ atividadeId, aoConcluir, aoFechar }) {
  const [indiceRodada, setIndiceRodada] = useState(0);
  const [acertos, setAcertos] = useState([]);
  const [rodadaConcluida, setRodadaConcluida] = useState(false);
  const opcaoTocada = useRef('');
  const desafios = rodadas[indiceRodada];
  const ultimaRodada = indiceRodada === rodadas.length - 1;

  function tocarOpcao(indice, opcao) {
    opcaoTocada.current = `${indice}-${opcao}`;
    falar(opcao);
  }

  function responder(indice, opcao) {
    const chave = `${indice}-${opcao}`;
    const jaTocou = opcaoTocada.current === chave;
    opcaoTocada.current = '';
    // Depois de acertar, a linha vira um espaço de prática: qualquer opção
    // ainda pode ser ouvida sem mudar o resultado já registrado.
    if (acertos.includes(indice)) {
      if (!jaTocou) falar(opcao);
      return;
    }
    if (!jaTocou) falar(opcao);
    const desafio = desafios[indice];
    if (opcao !== desafio.resposta) {
      registrarResultadoPorId(atividadeId, opcao, desafio.resposta);
      return;
    }

    const novosAcertos = [...acertos, indice];
    setAcertos(novosAcertos);
    if (novosAcertos.length === desafios.length) {
      setRodadaConcluida(true);
      if (ultimaRodada) {
        registrarResultadoPorId(atividadeId, 'rimas encontradas', 'rimas encontradas');
        aoConcluir();
      }
    }
  }

  function proximaRodada() {
    setIndiceRodada((atual) => atual + 1);
    setAcertos([]);
    setRodadaConcluida(false);
  }

  return <section className="game-session" aria-live="polite"><div className="game-session-card word-session rimas-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>DESAFIO BÔNUS · PALAVRAS QUE RIMAM</span><small className="game-round">Rodada {indiceRodada + 1} de {rodadas.length}</small>
    <h2>Caça-rimas</h2><p>Qual palavra rima?</p>
    <div className="rimas-lista">{desafios.map((desafio, indice) => {
      const acertou = acertos.includes(indice);
      return <article className={`rima-linha ${acertou ? 'rima-encontrada' : ''}`} key={desafio.palavra}>
        <button className="rima-alvo" type="button" onClick={() => falar(desafio.palavra)} aria-label={`Ouvir a palavra ${desafio.palavra}`}><i aria-hidden="true">{desafio.icone}</i><b>{desafio.palavra}</b><small>🔊</small></button>
        <span>rima com</span>
        <div className="rima-opcoes">{desafio.opcoes.map((opcao) => <button className={acertou && opcao === desafio.resposta ? 'rima-certa' : ''} type="button" key={opcao} onPointerDown={() => tocarOpcao(indice, opcao)} onClick={() => responder(indice, opcao)}>{opcao}</button>)}</div>
        {acertou && <strong aria-label="Rima encontrada">✓</strong>}
      </article>;
    })}</div>
    {rodadaConcluida && !ultimaRodada && <button className="small-primary rimas-proxima" type="button" onClick={proximaRodada}>Próxima rodada →</button>}
  </div></section>;
}
