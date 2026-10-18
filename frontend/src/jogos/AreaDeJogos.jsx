import { useState } from 'react';
import CacaAsLetras from './CacaAsLetras';
import MonteAPalavra from './MonteAPalavra';
import OucaEEscolha from './OucaEEscolha';
import { obterCriancaId } from '../utils/auth';
import { useResumoProgresso } from '../utils/etapas';

// Cada etapa cadastrada no banco (pela chave) tem a sua tela de jogos.
const telasDasEtapas = {
  'caca-as-letras': { Tela: CacaAsLetras, icone: '🔤', legenda: 'A · B · C' },
  'monte-a-palavra': { Tela: MonteAPalavra, icone: '🧩', legenda: 'BA + LA' },
  'ouca-e-escolha': { Tela: OucaEEscolha, icone: '👂', legenda: 'Frases' },
};

const textoSituacao = { concluida: 'Concluída', atual: 'Etapa atual', bloqueada: 'Bloqueada' };

export default function AreaDeJogos({ Cabecalho, Rodape, onNavigate }) {
  const { resumo, erro, recarregar } = useResumoProgresso(obterCriancaId());
  const [selecionada, setSelecionada] = useState(null);

  const etapas = (resumo?.etapas ?? []).filter((etapa) => telasDasEtapas[etapa.chave]);
  const atual = etapas.find((etapa) => etapa.situacao === 'atual');
  const visualizada = etapas.find((etapa) => etapa.chave === selecionada) ?? atual ?? etapas[0];
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
          return <button
            key={etapa.chave}
            type="button"
            className={`world-card ${bloqueada ? 'locked' : 'available'} ${etapa.chave === visualizada?.chave ? 'selected-world' : ''}`}
            disabled={bloqueada}
            onClick={() => setSelecionada(etapa.chave)}
          >
            <div className="world-icon">{bloqueada ? '🔒' : icone}</div>
            <strong>{etapa.nome}</strong>
            <small>{bloqueada ? '???' : legenda}</small>
            <span>{textoSituacao[etapa.situacao]}{bloqueada ? '' : ` · ${etapa.percentual}%`}</span>
          </button>;
        })}
      </section>
      {/* key: ao trocar de etapa, a tela recomeça do zero */}
      {Tela && <Tela key={visualizada.chave} jogavel={visualizada.situacao === 'atual'} />}
      <p className="games-journey-note">
        <span>{visualizada?.situacao === 'concluida' ? '⭐' : '🔒'}</span>
        {visualizada?.situacao === 'concluida'
          ? 'Etapa concluída! Você pode passar para a próxima etapa da trilha.'
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
