import { useRef, useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

const parlendas = [
  {
    titulo: 'Feijão com arroz', icone: '🍚', decoracoes: ['🥄', '🫘', '🍽️'],
    texto: 'Um, dois, feijão com arroz.\nTrês, quatro, feijão no prato.\nCinco, seis, falar inglês.\nSete, oito, comer biscoito.\nNove, dez, comer pastéis.',
    tipo: 'caça à rima', pergunta: 'Qual palavra faz rima com BISCOITO?', resposta: 'OITO', opcoes: ['OITO', 'SEIS', 'DEZ'],
  },
  {
    titulo: 'Uni, duni, tê', icone: '🍦', decoracoes: ['🎲', '✨', '🍬'],
    texto: 'Uni, duni, tê,\nSalamê, mingüê,\nUm sorvete colorê,\nO escolhido foi você!',
    tipo: 'complete o verso', pergunta: 'O escolhido foi ____!', resposta: 'VOCÊ', opcoes: ['VOCÊ', 'SORVETE', 'TÊ'],
  },
  {
    titulo: 'Hoje é domingo', icone: '🐂', decoracoes: ['🌞', '🌎', '🕳️'],
    texto: 'Hoje é domingo, pede cachimbo.\nO cachimbo é de ouro, bate no touro.\nO touro é valente, bate na gente.\nA gente é fraco, cai no buraco.\nO buraco é fundo, acabou-se o mundo.',
    tipo: 'caça à rima', pergunta: 'Qual palavra faz rima com OURO?', resposta: 'TOURO', opcoes: ['TOURO', 'GENTE', 'MUNDO'],
  },
  {
    titulo: 'Batatinha', icone: '🥔', decoracoes: ['🌱', '💤', '❤️'],
    texto: 'Batatinha quando nasce\nse esparrama pelo chão.\nMenininha quando dorme\npõe a mão no coração.',
    tipo: 'complete o verso', pergunta: 'Põe a mão no ____.', resposta: 'CORAÇÃO', opcoes: ['CORAÇÃO', 'CHÃO', 'SONO'],
  },
];

export default function DesafioDaParlenda({ atividadeId, aoConcluir, aoFechar }) {
  const [etapa, setEtapa] = useState('introducao');
  const [indice, setIndice] = useState(0);
  const [retorno, setRetorno] = useState('');
  const [audioTocando, setAudioTocando] = useState(false);
  const audioAtual = useRef(0);
  const [opcoes, setOpcoes] = useState(() => embaralhar(parlendas[0].opcoes));
  const parlenda = parlendas[indice];
  const ultima = indice === parlendas.length - 1;

  function tocar(texto) {
    // Um pouco mais rápida para preservar o ritmo natural da parlenda.
    const identificador = audioAtual.current + 1;
    audioAtual.current = identificador;
    setAudioTocando(true);
    falar(texto, 1.16, () => {
      if (audioAtual.current === identificador) setAudioTocando(false);
    });
  }

  function alternarAudio(texto) {
    if (audioTocando) {
      audioAtual.current += 1;
      window.speechSynthesis.cancel();
      setAudioTocando(false);
      return;
    }
    tocar(texto);
  }

  function comecar() {
    setEtapa('conhecer');
    tocar(parlendas[0].texto);
  }

  function abrirDesafio() {
    setEtapa('desafio');
    tocar(parlenda.texto);
  }

  function responder(opcao) {
    if (retorno === 'correct') return;
    tocar(opcao);
    const correta = opcao === parlenda.resposta;
    setRetorno(correta ? 'correct' : 'incorrect');
    if (correta) {
      if (ultima) registrarResultadoPorId(atividadeId, opcao, parlenda.resposta);
      window.setTimeout(avancar, 1050);
    } else {
      registrarResultadoPorId(atividadeId, opcao, parlenda.resposta);
    }
  }

  function avancar() {
    if (ultima) { aoConcluir(); return; }
    const proxima = parlendas[indice + 1];
    setIndice(indice + 1);
    setOpcoes(embaralhar(proxima.opcoes));
    setRetorno('');
    setEtapa('conhecer');
    tocar(proxima.texto);
  }

  return <section className="game-session" aria-live="polite"><div className="game-session-card word-session parlenda-session">
    <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
    <span>DESAFIO BÔNUS · PARLENDAS</span>
    {etapa === 'introducao' ? <div className="parlenda-introducao">
      <button className="listen-button parlenda-listen" type="button" onClick={() => alternarAudio('Parlendas são brincadeiras populares de palavras, cheias de ritmo, rimas e repetições, fazendo parte da tradição oral e do folclore brasileiro. Ao ouvir e brincar com elas, você treina a escuta, percebe sons parecidos e se prepara para ler cada vez melhor.')} aria-label={audioTocando ? 'Parar explicação sobre parlendas' : 'Ouvir explicação sobre parlendas'}>🎧<small>{audioTocando ? 'PARAR' : 'OUVIR'}</small></button>
      <h2>O que é uma parlenda?</h2>
      <p>Parlendas são brincadeiras populares de palavras, cheias de ritmo, rimas e repetições, fazendo parte da tradição oral e do folclore brasileiro.</p>
      <p>Ao ouvir e brincar com elas, você treina a escuta, percebe sons parecidos e se prepara para ler cada vez melhor.</p>
      <button className="small-primary parlenda-start" type="button" onClick={comecar}>Vamos brincar de parlenda!</button>
    </div> : <>
      <small className="parlenda-contador">{indice + 1} de {parlendas.length}</small>
      {etapa === 'conhecer' ? <>
        <div className="parlenda-cena">
          <i aria-hidden="true">{parlenda.decoracoes[0]}</i>
          <button className="parlenda-ilustracao" type="button" onClick={() => alternarAudio(parlenda.texto)} aria-label={audioTocando ? `Parar parlenda ${parlenda.titulo}` : `Ouvir parlenda ${parlenda.titulo}`}><b aria-hidden="true">{parlenda.icone}</b><small>{audioTocando ? 'PARAR' : 'OUVIR'} 🔊</small></button>
          <i aria-hidden="true">{parlenda.decoracoes[1]}</i>
        </div>
        <h2>{parlenda.titulo}</h2>
        <p className="parlenda-instrucao">Toque na figura para ouvir a parlenda.</p>
        <div className="parlenda-texto" aria-label={`Texto da parlenda ${parlenda.titulo}`}><i aria-hidden="true">{parlenda.decoracoes[2]}</i><div>{parlenda.texto}</div></div>
        <button className="small-primary parlenda-start" type="button" onClick={abrirDesafio}>Já conheço! Quero o desafio</button>
      </> : <>
        <h2 className="parlenda-desafio-titulo">{parlenda.tipo === 'caça à rima' ? 'Encontre a rima!' : 'Complete o verso!'}</h2>
        <p className="parlenda-desafio-instrucao">Ouça a parlenda de novo se precisar e escolha a melhor resposta.</p>
        <button className="sentence-clue parlenda-audio-button" type="button" onClick={() => alternarAudio(parlenda.texto)}>🔊 {audioTocando ? 'Parar áudio' : 'Ouvir a parlenda'}</button>
        <div className="missing-sentence parlenda-verso"><i aria-hidden="true">{parlenda.icone}</i><b>{parlenda.pergunta}</b></div>
        <div className="letter-options parlenda-options">{opcoes.map((opcao) => <button type="button" key={opcao} onClick={() => responder(opcao)}>{opcao}</button>)}</div>
        <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && ultima} />}</div>
      </>}
    </>}
  </div></section>;
}
