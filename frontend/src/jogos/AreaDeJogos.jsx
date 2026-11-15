import { useEffect, useState } from 'react';
import CacaAsLetras from './CacaAsLetras';
import MonteAPalavra from './MonteAPalavra';
import OucaEEscolha from './OucaEEscolha';
import LeiaEDescubra from './LeiaEDescubra';
import { obterCriancaId } from '../utils/auth';
import { useResumoProgresso } from '../utils/etapas';

// chave da etapa no banco -> tela de jogos
const telasDasEtapas = {
  'caca-as-letras': {
    Tela: CacaAsLetras, icone: '🔤', legenda: 'A · B · C',
    objetivo: 'Reconhecer letras, associar sons iniciais e fortalecer a memória visual.',
    descricao: 'A criança explora a relação entre letras, sons e imagens, construindo uma base importante para a alfabetização.',
  },
  'monte-a-palavra': {
    Tela: MonteAPalavra, icone: '🧩', legenda: 'BA + LA',
    objetivo: 'Desenvolver consciência silábica e formar palavras.',
    descricao: 'A criança percebe que as palavras são formadas por partes menores e passa a relacionar a escrita com seu significado.',
  },
  'ouca-e-escolha': {
    Tela: OucaEEscolha, icone: '👂', legenda: 'Frases',
    objetivo: 'Trabalhar compreensão oral de frases e escuta atenta.',
    descricao: 'A criança desenvolve atenção aos sons e ao sentido do que ouve, ampliando a compreensão da linguagem oral.',
  },
  'leia-e-descubra': {
    Tela: LeiaEDescubra, icone: '🔎', legenda: 'Textos',
    objetivo: 'Avançar para leitura e compreensão de textos curtos.',
    descricao: 'A criança começa a conectar palavras, ideias e acontecimentos para compreender melhor o que lê.',
  },
};

export default function AreaDeJogos({ Cabecalho, Rodape, onNavigate }) {
  const { resumo, erro, recarregar } = useResumoProgresso(obterCriancaId());
  const [selecionada, setSelecionada] = useState(null);
  const [etapaInfo, setEtapaInfo] = useState(null);

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
          return <div className="world-card-wrap" key={etapa.chave}>
            <button
              type="button"
              className={`world-card ${bloqueada ? 'locked' : 'available'} ${faixaProgresso} ${etapa.chave === visualizada?.chave ? 'selected-world' : ''}`}
              disabled={bloqueada}
              onClick={() => setSelecionada(etapa.chave)}
            >
              <div className="world-icon">{bloqueada ? '🔒' : icone}</div>
              <strong>{etapa.nome}</strong>
              <small>{bloqueada ? '???' : legenda}</small>
              <span className="world-progress"><i aria-hidden="true">{etapa.percentual === 100 ? '★' : etapa.percentual > 0 ? '●' : '○'}</i><em>{textoProgresso}</em><b>{etapa.percentual}%</b></span>
            </button>
            <button className="world-info-button" type="button" onClick={() => setEtapaInfo(etapa.chave)} aria-label={`Sobre a etapa ${etapa.nome}`}>i</button>
          </div>;
        })}
      </section>
      {etapaInfo && <div className="stage-info-overlay" role="presentation" onClick={() => setEtapaInfo(null)}>
        <section className="stage-info-dialog" role="dialog" aria-modal="true" aria-labelledby="stage-info-title" onClick={(evento) => evento.stopPropagation()}>
          <button className="stage-info-close" type="button" onClick={() => setEtapaInfo(null)} aria-label="Fechar explicação">×</button>
          <span className="stage-info-icon" aria-hidden="true">{telasDasEtapas[etapaInfo].icone}</span>
          <small>OBJETIVO DA ETAPA</small>
          <h2 id="stage-info-title">{etapas.find((etapa) => etapa.chave === etapaInfo)?.nome}</h2>
          <p className="stage-info-objective">{telasDasEtapas[etapaInfo].objetivo}</p>
          <p>{telasDasEtapas[etapaInfo].descricao}</p>
        </section>
      </div>}
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
