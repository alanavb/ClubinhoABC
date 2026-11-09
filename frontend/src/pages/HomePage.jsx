import { AppFooter, AppHeader } from '../components/layout/AppLayout';
import { AvisoFaixaEtaria, IndicadoresProgresso, MapaAventura } from '../components/progresso/Progresso';
import { obterCriancaId, obterCriancaSelecionada } from '../utils/auth';
import { useResumoProgresso } from '../utils/etapas';

export default function HomePage({ onNavigate }) {
  const crianca = obterCriancaSelecionada();
  const nomeCrianca = crianca?.nome || 'criança';
  const { resumo, erro, recarregar } = useResumoProgresso(obterCriancaId());
  return <main className="app-shell"><AppHeader active="início" onNavigate={onNavigate} /><section className="home-content"><AvisoFaixaEtaria crianca={crianca} /><div className="journey-heading"><img src="/images/ilustra-progresso.png" alt="" /><div><span>Acompanhamento</span><h1>A jornada de {nomeCrianca}</h1></div></div><IndicadoresProgresso resumo={resumo} erro={erro} recarregar={recarregar} /><MapaAventura nomeCrianca={nomeCrianca} etapas={resumo?.etapas} tituloId="map-title" /></section><AppFooter /></main>;
}
