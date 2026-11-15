import { useEffect, useState } from 'react';
import CacaAsLetras from './CacaAsLetras';
import MonteAPalavra from './MonteAPalavra';
import OucaEEscolha from './OucaEEscolha';
import LeiaEDescubra from './LeiaEDescubra';
import { obterCriancaId } from '../utils/auth';
import { useResumoProgresso } from '../utils/etapas';

// chave da etapa no banco -> tela de jogos
const telasDasEtapas = {
  'caca-as-letras': { Tela: CacaAsLetras, icone: '🔤', legenda: 'A · B · C' },
  'monte-a-palavra': { Tela: MonteAPalavra, icone: '🧩', legenda: 'BA + LA' },
  'ouca-e-escolha': { Tela: OucaEEscolha, icone: '👂', legenda: 'Frases' },
  'leia-e-descubra': { Tela: LeiaEDescubra, icone: '🔎', legenda: 'Textos' },
};

export default function AreaDeJogos({ Cabecalho, Rodape, onNavigate }) {
  const { resumo, erro, recarregar } = useResumoProgresso(obterCriancaId());
  const [selecionada, setSelecionada] = useState(null);

  const etapas = (resumo?.etapas ?? []).filter((etapa) => telasDasEtapas[etapa.chave]);
  const atual = etapas.find((etapa) => etapa.situacao === 'atual');
  // trilha completa não tem etapa "atual": mostra a última, por causa do bônus
  const visualizada = etapas.find((etapa) => etapa.chave === selecionada) ?? atual ?? etapas[etapas.length - 1];
  // a trilha avança no back-end, mas a tela fica na etapa jogada para mostrar o bônus
  useEffect(() => {
    if (!selecionada && visualizada) setSelecionada(visualizada.chave);
  }, [selecionada, visualizada]);

  const posicao = visualizada ? etapas.indexOf(visualizada) + 1 : 0;
  const Tela = visualizada && telasDasEtapas[visualizada.chave].Tela;

  let conteudo;
  if (erro) {
    conteudo = <p className="form-message games-status" role="alert">Não foi possível carregar a sua trilha. <button className="text-link" type="button" onClick={recarregar}>Tentar de novo</button></p>;
  } else if (!resumo) {
    conteudo = <p className="form-message games-status" role="status">Carregando a sua trilha…</p>;
  } else {
    conteudo = <>
      <section className="games-world-trail" aria-label="Etapas da trilha de alfabetização">
        {etapas.map((etapa) => {
          const { icone, legenda } = telasDasEtapas[etapa.chave];
          const bloqueada = etapa.situacao === 'bloqueada';
          const faixaProgresso = etapa.percentual === 100
            ? 'progress-complete'
            : etapa.percentual > 0
              ? 'progress-partial'
              : 'progress-start';
          const textoProgresso = bloqueada
            ? 'A descobrir'
            : etapa.situacao === 'concluida'
              ? 'Concluída'
              : etapa.percentual === 100
                ? 'Liberando...'
              : etapa.percentual > 0
                ? 'Em andamento'
                : 'Ainda não iniciada';
          return <button
            key={etapa.chave}
            type="button"
            className={`world-card ${bloqueada ? 'locked' : 'available'} ${faixaProgresso} ${etapa.chave === visualizada?.chave ? 'selected-world' : ''}`}
            disabled={bloqueada}
            onClick={() => setSelecionada(etapa.chave)}
          >
            <div className="world-icon">{bloqueada ? '🔒' : icone}</div>
            <strong>{etapa.nome}</strong>
            <small>{bloqueada ? '???' : legenda}</small>
            <span className="world-progress"><i aria-hidden="true">{etapa.percentual === 100 ? '★' : etapa.percentual > 0 ? '●' : '○'}</i><em>{textoProgresso}</em><b>{etapa.percentual}%</b></span>
          </button>;
        })}
      </section>
      {/* key: trocar de etapa recomeça a tela */}
      {Tela && <Tela key={visualizada.chave} jogavel={visualizada.situacao !== 'bloqueada'} />}
      <p className="games-journey-note">
        <span>{visualizada?.situacao === 'concluida' ? '⭐' : '🔒'}</span>
        {visualizada?.situacao === 'concluida'
          ? 'Etapa concluída! Jogue qualquer fase de novo para treinar ou toque na próxima etapa da trilha.'
          : visualizada?.percentual === 100
            ? 'Ótimo! Estamos liberando a próxima etapa.'
          : 'Complete as atividades obrigatórias para abrir a próxima etapa!'}
      </p>
    </>;
  }

  return <main className="app-shell"><Cabecalho active="jogos" onNavigate={onNavigate} />
    <section className="page-content games-page games-journey-page">
      <div className="games-heading">
        <img src="/images/ilustra-jogos.png" alt="" />
        <div><span>★ Minha trilha</span><h1>Vamos jogar!</h1></div>
        {visualizada && <div className="games-stage-indicator">
          <b>Etapa {posicao}</b><small>{visualizada.percentual}%</small>
          <i style={{ '--stage-progress': `${visualizada.percentual}%` }}><em /></i>
        </div>}
      </div>
      {conteudo}
    </section>
    <Rodape />
  </main>;
}
