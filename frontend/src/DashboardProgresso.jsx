// RF06: dados exibidos no painel do responsável

import { useDashboard } from './utils/dashboard';

// Ícones reutilizados no painel
const caminhosDosIcones = {
  respostas: 'M5 7h14M5 12h14M5 17h9',
  acertos: 'M5 12.5l4.5 4.5L19 7.5',
  erros: 'M7 7l10 10M17 7L7 17',
  media: 'M4 17l5-5 4 4 7-8M15 8h5v5',
};

// Ícone dos indicadores do painel
function Icone({ nome }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d={caminhosDosIcones[nome]} />
    </svg>
  );
}

// Nome abreviado do dia para o gráfico semanal
function diaDaSemana(data) {
  // Usa meio-dia para evitar mudança de data por fuso
  return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
}

// Cálculo de percentual para gráficos
function porcentagem(parte, total) {
  return total ? (100 * parte) / total : 0;
}

// Cartão numérico de desempenho
function NumeroDestaque({ icone, valor, rotulo, tom }) {
  return (
    <article className={`painel-numero ${tom}`}>
      <span className="painel-numero-icone"><Icone nome={icone} /></span>
      <div><strong>{valor}</strong><small>{rotulo}</small></div>
    </article>
  );
}

// Gráfico de distribuição entre acertos e erros
function GraficoRosca({ acertos, erros, taxa }) {
  const total = acertos + erros;
  return (
    <section className="painel-card">
      <h3>Acertos e erros</h3>
      <p className="painel-subtitulo">Todas as tentativas, inclusive ao jogar de novo</p>
      <div className="painel-rosca-area">
        <div className="painel-rosca" style={{ '--taxa': `${taxa}%` }} role="img" aria-label={`${taxa}% das tentativas estão certas`}>
          <div><strong>{taxa}%</strong><small>de acertos</small></div>
        </div>
        <ul className="painel-legenda">
          <li><i className="acerto" /><span>Acertos</span><b>{acertos}</b><em>{Math.round(porcentagem(acertos, total))}%</em></li>
          <li><i className="erro" /><span>Erros</span><b>{erros}</b><em>{Math.round(porcentagem(erros, total))}%</em></li>
        </ul>
      </div>
    </section>
  );
}

// Gráfico de desempenho em cada etapa
function GraficoPorEtapa({ etapas }) {
  return (
    <section className="painel-card">
      <h3>Desempenho em cada etapa</h3>
      <p className="painel-subtitulo">Proporção de acertos e erros por etapa da trilha</p>
      <div className="painel-etapas">
        {etapas.map((etapa) => (
          <div className="painel-etapa" key={etapa.etapa_id}>
            <div className="painel-etapa-titulo"><strong>{etapa.nome}</strong><b>{etapa.tentativas ? `${etapa.taxa_acerto}%` : '—'}</b></div>
            <div className="painel-barra" role="img" aria-label={`${etapa.nome}: ${etapa.acertos} acertos e ${etapa.erros} erros`}>
              {etapa.tentativas > 0 && <>
                <span className="acerto" style={{ width: `${porcentagem(etapa.acertos, etapa.tentativas)}%` }} />
                <span className="erro" style={{ width: `${porcentagem(etapa.erros, etapa.tentativas)}%` }} />
              </>}
            </div>
            <small>{etapa.tentativas ? `${etapa.acertos} acertos · ${etapa.erros} erros` : 'Ainda não jogou esta etapa'}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

// Gráfico da evolução nos últimos sete dias
function GraficoEvolucao({ dias }) {
  const maior = Math.max(1, ...dias.map((dia) => dia.tentativas));
  // Marcas do eixo do gráfico
  const marcas = [...new Set([maior, Math.round(maior / 2), 0])];
  return (
    <section className="painel-card painel-evolucao">
      <div className="painel-card-topo">
        <div><h3>Desenvolvimento nos últimos 7 dias</h3><p className="painel-subtitulo">Tentativas por dia</p></div>
        <ul className="painel-legenda horizontal"><li><i className="acerto" />Acertos</li><li><i className="erro" />Erros</li></ul>
      </div>
      <div className="painel-grafico">
        {marcas.map((marca) => (
          <div className="painel-grade-linha" key={marca} style={{ bottom: `${porcentagem(marca, maior)}%` }}><span>{marca}</span></div>
        ))}
        <div className="painel-colunas">
          {dias.map((dia) => (
            <div className="painel-coluna" key={dia.data}>
              {dia.tentativas > 0 && <b>{dia.tentativas}</b>}
              <div className="painel-coluna-barra" role="img" aria-label={`${diaDaSemana(dia.data)}: ${dia.acertos} acertos e ${dia.erros} erros`} style={{ height: `${porcentagem(dia.tentativas, maior)}%` }}>
                {dia.tentativas > 0 && <>
                  <span className="erro" style={{ height: `${porcentagem(dia.erros, dia.tentativas)}%` }} />
                  <span className="acerto" style={{ height: `${porcentagem(dia.acertos, dia.tentativas)}%` }} />
                </>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="painel-eixo-x">{dias.map((dia) => <small key={dia.data}>{diaDaSemana(dia.data)}</small>)}</div>
    </section>
  );
}

// Lista de atividades com maior dificuldade
function Dificuldades({ dificuldades }) {
  return (
    <section className="painel-card">
      <h3>Maiores dificuldades</h3>
      <p className="painel-subtitulo">Atividades com a menor taxa de acerto</p>
      {dificuldades.length === 0
        ? <p className="painel-vazio">Nenhuma dificuldade registrada até agora.</p>
        : <ol className="painel-dificuldades">
          {dificuldades.map((atividade, indice) => (
            <li key={atividade.atividade_id}>
              <span className="painel-posicao">{indice + 1}</span>
              <div>
                <div className="painel-dificuldade-titulo"><strong>{atividade.nome}</strong><em>{atividade.taxa_acerto}%</em></div>
                <span className="painel-mini-barra"><i style={{ width: `${atividade.taxa_acerto}%` }} /></span>
                <small>{atividade.etapa_nome} · {atividade.erros} {atividade.erros === 1 ? 'erro' : 'erros'} em {atividade.tentativas} {atividade.tentativas === 1 ? 'tentativa' : 'tentativas'}</small>
              </div>
            </li>
          ))}
        </ol>}
    </section>
  );
}

// Recomendações de prática para o responsável
function Recomendacoes({ recomendacoes, nomeCrianca, onNavigate }) {
  return (
    <section className="painel-card painel-recomendacoes">
      <h3>O que {nomeCrianca} deve praticar mais</h3>
      <p className="painel-subtitulo">Sugestões a partir das maiores dificuldades</p>
      {recomendacoes.length === 0
        ? <p className="painel-vazio">Sem pontos de atenção. Siga a trilha para aprender coisas novas.</p>
        : <ol>{recomendacoes.map((item, indice) => <li key={item.atividade}><span className="painel-posicao">{indice + 1}</span><p>{item.texto}<small>{item.etapa}</small></p></li>)}</ol>}
      <button className="small-primary" type="button" onClick={() => onNavigate('jogos')}>Praticar agora <span>→</span></button>
    </section>
  );
}

// Painel completo de desempenho da criança
export default function DashboardProgresso({ criancaId, nomeCrianca, onNavigate }) {
  const { dados, erro, recarregar } = useDashboard(criancaId);

  let conteudo;
  if (erro) {
    conteudo = <p className="form-message" role="alert">Não foi possível carregar o desempenho. <button className="text-link" type="button" onClick={recarregar}>Tentar de novo</button></p>;
  } else if (!dados) {
    conteudo = <p className="form-message" role="status">Carregando o desempenho…</p>;
  } else if (dados.totais.tentativas === 0) {
    conteudo = (
      <div className="painel-card painel-sem-dados">
        <p>Assim que {nomeCrianca} começar a jogar, os gráficos de desempenho aparecem aqui.</p>
        <button className="small-primary" type="button" onClick={() => onNavigate('jogos')}>Ir para os jogos <span>→</span></button>
      </div>
    );
  } else {
    const { totais } = dados;
    conteudo = <>
      <div className="painel-numeros">
        <NumeroDestaque icone="respostas" valor={totais.tentativas} rotulo="tentativas" tom="azul" />
        <NumeroDestaque icone="acertos" valor={totais.acertos} rotulo="acertos" tom="verde" />
        <NumeroDestaque icone="erros" valor={totais.erros} rotulo="erros" tom="vermelho" />
        <NumeroDestaque icone="media" valor={`${totais.taxa_acerto}%`} rotulo="média de acertos" tom="laranja" />
      </div>
      {/* explica por que há mais tentativas do que atividades */}
      <p className="painel-explicacao">
        <b>Como contamos:</b> cada resposta de {nomeCrianca} conta como uma tentativa, certa ou errada.
        Como as atividades têm várias rodadas, as tentativas passam do número de atividades.
        Errar faz parte do aprendizado: o que importa é a média de acertos subir com o tempo.
      </p>
      <div className="painel-grade">
        <GraficoRosca acertos={totais.acertos} erros={totais.erros} taxa={totais.taxa_acerto} />
        <GraficoPorEtapa etapas={dados.por_etapa} />
      </div>
      <GraficoEvolucao dias={dados.evolucao} />
      <div className="painel-grade">
        <Dificuldades dificuldades={dados.dificuldades} />
        <Recomendacoes recomendacoes={dados.recomendacoes} nomeCrianca={nomeCrianca} onNavigate={onNavigate} />
      </div>
    </>;
  }

  return (
    <section className="painel-desempenho" aria-labelledby="painel-titulo">
      <div className="painel-cabecalho"><span>Painel dos responsáveis</span><h2 id="painel-titulo">Desempenho de {nomeCrianca}</h2></div>
      {conteudo}
    </section>
  );
}
