import { useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

const rodadas = [ 
    { remetente: 'da Titia', texto: 'Fiz um bolo de chocolate. Ele está na mesa.', pergunta: 'Onde está o bolo?', resposta: 'Na mesa.', opcoes: ['Na mesa.', 'Na bolsa.', 'No forno.'] },
    { remetente: 'da Mamãe', texto: 'Fui ao mercado comprar pão e leite. Volto logo.', pergunta: 'O que a mamãe foi comprar?', resposta: 'Pão e leite.', opcoes: ['Pão e leite.', 'Bolo e suco.', 'Pizza e Doces.'] },
    { remetente: 'da Vizinha', texto: 'Meu gato fugiu para o jardim. Ele é preto e pequeno.', pergunta: 'Como é o gato?', resposta: 'Preto e pequeno.', opcoes: ['Preto e pequeno.', 'Branco e grande.', 'Preto e grande.'] },
];

export default function LeiaOBilhete({ atividadeId, aoConcluir, aoFechar }) {
    const [indice, setIndice] = useState(0);
    const [opcoes, setOpcoes] = useState(() => embaralhar(rodadas[0].opcoes));
    const [retorno, setRetorno] = useState('');
    const rodada = rodadas[indice];
    const ultima = indice === rodadas.length - 1;

    function responder(opcao) {
        if (retorno === 'correct') return;
        const correta = opcao === rodada.resposta;
        setRetorno(correta ? 'correct' : 'incorrect');
        if (correta) {
        // Todo acerto é registrado; apenas a última rodada conclui a atividade.
        registrarResultadoPorId(atividadeId, opcao, rodada.resposta, ultima);
      falar(opcao, 1, avancar);
        } else {
      falar(opcao);
      registrarResultadoPorId(atividadeId, opcao, rodada.resposta);
        }
    }

    function avancar() {
        if (ultima) { aoConcluir(); return; }
        setIndice(indice + 1);
        setOpcoes(embaralhar(rodadas[indice + 1].opcoes));
        setRetorno('');
    }

    return <section className="game-session sound-stage" aria-live="polite"><div className="game-session-card sound-session bilhete-session">
        <button className="close-game-session" type="button" onClick={aoFechar} aria-label="Voltar para as fases">×</button>
        <span>FASE 1 · LEIA O BILHETE</span><small className="game-round">{indice + 1} de {rodadas.length}</small>
        <h2>Leia o bilhete</h2>
        <article className="bilhete-card">
          <header><small>📝 Bilhete {rodada.remetente}</small><button type="button" onClick={() => falar(rodada.texto)} aria-label="Ouvir o bilhete">🔊</button></header>
          <p>{rodada.texto}</p>
        </article>
        <h3 className="reading-question">{rodada.pergunta}</h3>
        <div className="sentence-signs">{opcoes.map((opcao) => <button type="button" key={opcao} onClick={() => responder(opcao)}><b>{opcao}</b></button>)}</div>
        <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && ultima} />}</div>
        </div></section>;
}
