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
  const [concluido, setConcluido] = useState(false);
  const opcaoTocada = useRef('');
  const finalizando = useRef(false);
  const falaFinalTerminou = useRef(false);
  const popupMostrado = useRef(false);
  const desafios = rodadas[indiceRodada];
  const ultimaRodada = indiceRodada === rodadas.length - 1;

  function mostrarConclusao() {
    if (popupMostrado.current) return;
    popupMostrado.current = true;
    setConcluido(true);
    window.setTimeout(aoConcluir, 1300);
  }

  function terminarFalaFinal() {
    if (finalizando.current) mostrarConclusao();
    else falaFinalTerminou.current = true;
  }

  function tocarOpcao(indice, opcao) {
    opcaoTocada.current = `${indice}-${opcao}`;
    const eUltimoAcerto = ultimaRodada && opcao === desafios[indice].resposta && acertos.length === desafios.length - 1;
    falar(opcao, 1, eUltimoAcerto ? terminarFalaFinal : null);
  }

  function responder(indice, opcao) {
    const chave = `${indice}-${opcao}`;
    const jaTocou = opcaoTocada.current === chave;
    opcaoTocada.current = '';
    // Depois de acertar, a linha vira um espaço de prática: qualquer opção
    // ainda pode ser ouvida sem mudar o resultado já registrado.
    if (concluido || acertos.includes(indice)) {
      if (!jaTocou) falar(opcao);
      return;
    }
    const desafio = desafios[indice];
    if (!jaTocou) {
      const eUltimoAcerto = ultimaRodada && opcao === desafio.resposta && acertos.length === desafios.length - 1;
      falar(opcao, 1, eUltimoAcerto ? terminarFalaFinal : null);
    }
    if (opcao !== desafio.resposta) {
      registrarResultadoPorId(atividadeId, opcao, desafio.resposta);
      return;
    }

    const novosAcertos = [...acertos, indice];
    setAcertos(novosAcertos);
    if (novosAcertos.length === desafios.length) {
      setRodadaConcluida(true);
      if (ultimaRodada) {
        if (finalizando.current) return;
        finalizando.current = true;
        registrarResultadoPorId(atividadeId, 'rimas encontradas', 'rimas encontradas');
        if (falaFinalTerminou.current) mostrarConclusao();
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
    <span>DESAFIO BÔNUS · PALAVRAS QUE RIMAM</span><small className="game-round">{indiceRodada + 1} de {rodadas.length}</small>
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
    {concluido && <div className="rimas-conclusao" role="status"><span aria-hidden="true">🎉</span><strong>Você conseguiu!</strong><small>Parabéns, encontrou todas as rimas!</small></div>}
  </div></section>;
}
