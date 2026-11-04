import { useState } from 'react';
import { embaralhar, falar } from '../alfabeto';
import FeedbackResposta from '../caca-as-letras/FeedbackResposta';
import { registrarResultadoPorId } from '../../utils/resultados';

const rodadas = [ 
    { remetente: 'da Titia', texto: 'Fiz um bolo de chocolate. Ele está na mesa.', pergunta: 'Onde estáo bolo?', resposta: 'Na mesa.', opcoes: ['Na mesa.', 'Na bolsa.', 'No forno.'] },
    { remetente: 'da Mamãe', texto: 'Fui ao mercado comprar pão e leite. Volto logo.', pergunta: 'O que a mamãe foi comprar?', resposta: 'Pão e leite.', opcoes: ['Pão e leite.', 'Bolo e suco.', 'Pizza e Doces.'] },
    { remetente: 'da Vizinha', texto: 'Meu gato fugiu para o jardim. Ele é preto e pequeno.', pergunta: 'Como é o gato?', resposta: 'Preto e pequeno.', opcoes: ['Preto e pequeno.', 'Branco e grande.', 'Preto e grande.'] },
];

export default function LeiaOBilhete({ atividadeId,onConcluir, onFechar }) {
    const [indice, setIndice] = useState(0);
    const [opcoes, setOpcoes] = useState(() => embaralhar(rodadas[0].opcoes));
    const [retorno, setRetorno] = useState('');
    const rodada = rodadas[indice];
    const ultima = indice === rodadas.length - 1;

    function responder(opcao) {
        if (retorno === 'correct') return;
        falar(opcao);
        const correta = opcao === rodada.resposta;
        setRetorno(correta ? 'correct' : 'incorret');
        if (correta) {
        //A atividade só é registrada como feita quando a criança acerta a última rodada.
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
        <span>FASE 1 · LEIA O BILHETE</span><small className="game-round">Bilhete {indice + 1} de {rodadas.length}</small>
        <h2>O que o bilhete diz?</h2><p>Leia o bilhete com atenção. Depois, escolha a resposta certa.</p>
        <div className="missing-sentence reading-note"><small>📝 Bilhete {rodada.remetente}</small><b>{rodada.texto}</b></div>
        <button className="sentence-clue" type="button" onClick={() => falar(rodada.texto)}>🔊 Ouvir o bilhete (se precisar)</button>
        <h3 className="reading-question">{rodada.pergunta}</h3>
        <div className="sentence-signs">{opcoes.map((opcao) => <button type="button" key={opcao} onClick={() => responder(opcao)}><b>{opcao}</b></button>)}</div>
        <div className="feedback-slot">{retorno && <FeedbackResposta tipo={retorno} rodadaConcluida={retorno === 'correct' && ultima} />}</div>
        </div></section>;
}