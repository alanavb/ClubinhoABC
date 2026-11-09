import { AppFooter, AppHeader } from '../components/layout/AppLayout';
import { AvisoFaixaEtaria, IndicadoresProgresso, MapaAventura } from '../components/progresso/Progresso';
import { obterCriancaId, obterCriancaSelecionada } from '../utils/auth';
import { useResumoProgresso } from '../utils/etapas';

export default function HomePage({ onNavigate }) {
  const crianca = obterCriancaSelecionada();
  const nomeCrianca = crianca?.nome || 'criança';
  const { resumo, erro, recarregar } = useResumoProgresso(obterCriancaId());
  const cards = [['Jogar', 'ilustra-jogos.png', '', 'jogos'], ['Histórias', 'ilustra-historias.png', '', 'historias'], ['Atividades', 'ilustra-atividades.png', '', 'atividades'], ['Conquistas', 'ilustra-conquistas.png', '', 'progresso'], ['Jornada', 'ilustra-progresso.png', '', 'progresso']];
  return <main className="app-shell"><AppHeader active="início" onNavigate={onNavigate} /><section className="home-content"><AvisoFaixaEtaria crianca={crianca} /><div className="journey-heading"><img src="/images/ilustra-progresso.png" alt="" /><div><span>Acompanhamento</span><h1>A jornada de {nomeCrianca}</h1></div></div><IndicadoresProgresso resumo={resumo} erro={erro} recarregar={recarregar} /><MapaAventura nomeCrianca={nomeCrianca} etapas={resumo?.etapas} tituloId="map-title" /><section className="play-hero"><img src="/images/mascote.png" alt="" /><div><span>◖ Oi, {nomeCrianca}!</span><h2>Vamos brincar de ler?</h2><div className="syllables"><i>⛺</i><i>BA</i><i>BE</i><i>BI</i></div><button type="button" onClick={() => onNavigate('jogos')}>▶ <b>Começar</b></button></div></section><section className="shortcut-grid" aria-label="Atalhos do Clubinho">{cards.map(([title, image, badge, id]) => <button className="shortcut-card" type="button" onClick={() => onNavigate(id)} key={title}>{badge && <em>{badge}</em>}<img src={`/images/${image}`} alt="" /><strong>{title}</strong></button>)}</section></section><AppFooter /></main>;
}
