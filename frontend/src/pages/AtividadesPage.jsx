import { useEffect, useState } from 'react';
import { AppFooter, AppHeader } from '../components/layout/AppLayout';
import { obterCriancaSelecionada, obterToken } from '../utils/auth';
import { API_BASE_URL } from '../utils/api';

// Página de materiais e atividades complementares
export default function AtividadesPage({ onNavigate }) {
  const [filter, setFilter] = useState('Todas');
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const nomeCrianca = obterCriancaSelecionada()?.nome || 'criança';

  useEffect(() => {
    let ativa = true;
    async function carregarMateriais() {
      try {
        const resposta = await fetch(`${API_BASE_URL}/materiais`, {
          headers: { Authorization: `Bearer ${obterToken()}` },
        });
        if (!resposta.ok) throw new Error('Não foi possível carregar os materiais.');
        const materiais = await resposta.json();
        if (ativa) setDados(materiais);
      } catch (erro) {
        if (ativa) setErro(erro.message);
      }
    }
    carregarMateriais();
    return () => { ativa = false; };
  }, []);

  const visiveis = (dados?.materiais || []).filter((material) => filter === 'Todas' || material.categoria === filter);
  const kitDaSemana = dados?.kitDaSemana;
  const categorias = dados?.categorias || [];
  const referencia = dados?.referencia;

  return <main className="app-shell"><AppHeader active="atividades" onNavigate={onNavigate} /><section className="page-content activities-page"><span className="eyebrow">Para fazer junto</span><h1>Atividades e materiais</h1><p className="page-intro">Materiais originais para baixar e imprimir em folha A4, organizados por eixo de conteúdo, na ordem em que a criança avança na trilha.</p>{erro ? <p className="form-message" role="alert">{erro}</p> : <>{kitDaSemana && <section className="activity-feature"><div><span>Kit da semana</span><h2>{kitDaSemana.titulo}</h2><p>{kitDaSemana.paginas} {kitDaSemana.descricao} {nomeCrianca}.</p><a className="material-link" href={kitDaSemana.arquivo} download>⇩ &nbsp; Baixar</a><a className="material-link outline" href={kitDaSemana.arquivo} target="_blank" rel="noreferrer">🖨 &nbsp; Imprimir</a></div><b>{kitDaSemana.icone}</b></section>}<div className="filter-row">{categorias.map((item) => <button className={filter === item ? 'selected' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)} type="button" key={item}>{item}</button>)}</div><div className="activity-grid">{visiveis.map((material) => <article className="activity-card" key={material.id}><span className={`activity-icon ${material.tom}`}>{material.icone}</span><h2>{material.titulo}</h2><p>{material.eixo} · {material.paginas} páginas</p><a className="material-download" href={material.arquivo} download>⇩ &nbsp; Baixar</a><a className="material-print" href={material.arquivo} target="_blank" rel="noreferrer" title="Abrir para imprimir" aria-label={`Imprimir ${material.titulo}`}>🖨</a></article>)}</div>{referencia && <p className="materials-source">Os materiais são originais, produzidos para o Clubinho ABC. A organização por eixos de conteúdo segue como referência o guia <a href={referencia.url} target="_blank" rel="noreferrer">{referencia.titulo}</a>, do {referencia.veiculo}.</p>}</>}</section><AppFooter /></main>;
}
