import DashboardProgresso from '../DashboardProgresso';
import { AppFooter, AppHeader } from '../components/layout/AppLayout';
import { AvisoFaixaEtaria, Conquistas, IndicadoresProgresso, MapaAventura } from '../components/progresso/Progresso';
import { obterCriancaId, obterCriancaSelecionada } from '../utils/auth';
import { useResumoProgresso } from '../utils/etapas';

export default function ProgressoPage({ onNavigate }) {
  const crianca = obterCriancaSelecionada(); const nomeCrianca = crianca?.nome || 'criança'; const { resumo, erro, recarregar } = useResumoProgresso(obterCriancaId());
  return <main className="app-shell"><AppHeader active="progresso" onNavigate={onNavigate} /><section className="page-content progress-page"><AvisoFaixaEtaria crianca={crianca} /><div className="journey-heading"><img src="/images/ilustra-progresso.png" alt="" /><div><span>Acompanhamento</span><h1>A jornada de {nomeCrianca}</h1></div></div><IndicadoresProgresso resumo={resumo} erro={erro} recarregar={recarregar} /><MapaAventura nomeCrianca={nomeCrianca} etapas={resumo?.etapas} tituloId="progress-map-title" /><DashboardProgresso criancaId={obterCriancaId()} nomeCrianca={nomeCrianca} onNavigate={onNavigate} /><div className="progress-bottom"><section className="mastery"><h2>Progresso de {nomeCrianca} em cada etapa</h2>{(resumo?.etapas ?? []).map((etapa) => <div className="mastery-row" key={etapa.etapa_id}><strong>{etapa.nome}</strong><em>{etapa.situacao === 'bloqueada' ? 'a descobrir' : `${etapa.percentual}%`}</em><span><i style={{ width: `${etapa.percentual}%` }} /></span></div>)}</section><Conquistas conquistas={resumo?.conquistas} /></div></section><AppFooter /></main>;
}
