import { useEffect, useRef, useState } from 'react';
import { AppFooter, AppHeader } from '../components/layout/AppLayout';
import { obterToken } from '../utils/auth';
import { API_BASE_URL } from '../utils/api';
import { criarFala } from '../utils/voz';

// Separação do texto para destacar cada palavra durante a leitura
function separarPalavras(texto) {
  return [...texto.matchAll(/[A-Za-zÀ-ÖØ-öø-ÿ]+(?:-[A-Za-zÀ-ÖØ-öø-ÿ]+)*[.,!?;:]*/g)].map((resultado) => ({
    texto: resultado[0],
    inicio: resultado.index,
  }));
}

// Ícones dos controles de leitura
function IconeLeitor({ tipo }) {
  if (tipo === 'reiniciar') return <svg className="reader-icon-reiniciar" viewBox="0 0 24 24" aria-hidden="true"><path className="restart-arrowhead" d="M4 3v7h7Z" /><path d="M5.5 8A8 8 0 1 1 4 14" /></svg>;
  if (tipo === 'pausar') return <svg className="reader-icon-pausar" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>;
  return <svg className="reader-icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z" /></svg>;
}

// Leitor de histórias com acompanhamento da narração
function LivroHistoria({ historia, onVoltar, onNavigate }) {
  const palavras = separarPalavras(historia.texto);
  const falaAtual = useRef(null);
  const proximaPalavra = useRef(0);
  const [palavraAtiva, setPalavraAtiva] = useState(-1);
  const [lendo, setLendo] = useState(false);
  const [pausada, setPausada] = useState(false);
  const [repetindoPalavra, setRepetindoPalavra] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  // Localização da palavra narrada no texto
  function palavraNoIndiceDeCaractere(indice) {
    let encontrada = 0;
    palavras.forEach((palavra, posicao) => {
      if (palavra.inicio <= indice) encontrada = posicao;
    });
    return encontrada;
  }

  // Início da leitura a partir da palavra atual
  function iniciarLeitura(indiceInicial = proximaPalavra.current) {
    if (!('speechSynthesis' in window)) {
      setMensagem('A narração não está disponível neste navegador.');
      return;
    }
    if (indiceInicial >= palavras.length) indiceInicial = 0;
    window.speechSynthesis.cancel();

    const inicio = palavras[indiceInicial].inicio;
    const fala = criarFala(historia.texto.slice(inicio));
    fala.rate = 0.84;
    fala.onboundary = (evento) => {
      if (evento.name !== 'word') return;
      const indiceDaPalavra = palavraNoIndiceDeCaractere(inicio + evento.charIndex);
      proximaPalavra.current = indiceDaPalavra + 1;
      setPalavraAtiva(indiceDaPalavra);
    };
    fala.onstart = () => {
      if (falaAtual.current !== fala) return;
      setLendo(true);
      setPausada(false);
    };
    fala.onend = () => {
      if (falaAtual.current !== fala) return;
      setLendo(false);
      setPausada(false);
      setMensagem('Fim da história! Você pode ouvir de novo quando quiser.');
    };
    fala.onerror = () => {
      if (falaAtual.current !== fala) return;
      setLendo(false);
      setPausada(false);
      setMensagem('Não foi possível reproduzir a narração agora.');
    };
    falaAtual.current = fala;
    proximaPalavra.current = indiceInicial;
    setPalavraAtiva(indiceInicial);
    setLendo(true);
    setPausada(false);
    setMensagem('Acompanhe as palavras enquanto a história é lida.');
    window.speechSynthesis.speak(fala);
  }

  // Pausa ou retomada da leitura
  function pausarOuContinuar() {
    if (!('speechSynthesis' in window) || repetindoPalavra) return;
    if (!lendo && !pausada) {
      iniciarLeitura();
      return;
    }
    if (pausada) {
      if (falaAtual.current && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setLendo(true);
        setPausada(false);
        setMensagem('Leitura retomada.');
      } else {
        iniciarLeitura();
      }
      return;
    }
    window.speechSynthesis.pause();
    setLendo(false);
    setPausada(true);
    setMensagem('Leitura pausada.');
  }

  // Reprodução isolada de uma palavra
  function repetirPalavra(indice) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    falaAtual.current = null;
    proximaPalavra.current = indice + 1;
    setPalavraAtiva(indice);
    setLendo(false);
    setPausada(true);
    setRepetindoPalavra(true);
    setMensagem(`Ouvindo novamente: ${palavras[indice].texto}.`);
    const fala = criarFala(palavras[indice].texto);
    fala.rate = 0.78;
    fala.onend = () => {
      setRepetindoPalavra(false);
      setMensagem('Leitura pausada. Toque em continuar para seguir a história.');
    };
    fala.onerror = () => setRepetindoPalavra(false);
    window.speechSynthesis.speak(fala);
  }

  // Retorno da leitura ao início da história
  function recomecar() {
    proximaPalavra.current = 0;
    setPalavraAtiva(-1);
    iniciarLeitura(0);
  }

  return <main className="app-shell"><AppHeader active="historias" onNavigate={onNavigate} />
    <section className={`page-content story-reader-page story-theme-${historia.tema}`}>
      <button className="story-back" type="button" onClick={onVoltar}>← Voltar para histórias</button>
      <header className="story-reader-heading"><div><span className={`story-level story-level-${historia.nivelClasse}`}>{historia.nivel}</span><small>{historia.tag}</small></div><h1>{historia.title}</h1></header>
      <section className="storybook" aria-label={`Leitura da história ${historia.title}`}>
        <div className="storybook-decoration" aria-hidden="true">{historia.icon}</div>
        <div className="storybook-page">
          <p className="storybook-text">{palavras.map((palavra, indice) => <button key={`${palavra.inicio}-${palavra.texto}`} type="button" className={`story-word ${indice < palavraAtiva ? 'read' : ''} ${indice === palavraAtiva ? 'active' : ''}`} onClick={() => repetirPalavra(indice)}>{palavra.texto}</button>)}</p>
        </div>
        <div className="storybook-controls">
          <button className="story-control-button story-restart" type="button" onClick={recomecar} aria-label="Ouvir a história desde o começo" title="Recomeçar história"><IconeLeitor tipo="reiniciar" /></button>
          <button className="story-control-button story-pause" type="button" onClick={pausarOuContinuar} disabled={repetindoPalavra} aria-label={lendo ? 'Pausar leitura' : 'Ouvir ou continuar a história'} title={lendo ? 'Pausar' : 'Ouvir ou continuar'}>{repetindoPalavra ? '…' : <IconeLeitor tipo={lendo ? 'pausar' : 'play'} />}</button>
        </div>
        {mensagem && <p className="story-reader-status" role="status">{mensagem}</p>}
      </section>
    </section>
    <AppFooter />
  </main>;
}

// Janela com informações pedagógicas da história
function InformacoesHistoria({ historia, onClose }) {
  return <div className="terms-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="terms-dialog story-info-dialog" role="dialog" aria-modal="true" aria-labelledby="story-info-title">
      <button className="terms-close" type="button" onClick={onClose} aria-label="Fechar informações da história">×</button>
      <span className={`story-level story-level-${historia.nivelClasse}`}>{historia.nivel}</span>
      <h1 id="story-info-title">Sobre esta história</h1>
      <p><strong>Foco:</strong> {historia.objetivo}</p>
      <p><strong>Como ela foi pensada:</strong> {historia.metodologia}</p>
    </section>
  </div>;
}

// Página de seleção de histórias e parlendas
export default function StoriesPage({ onNavigate }) {
  const [stories, setStories] = useState([]);
  const [erro, setErro] = useState('');
  const [historiaAberta, setHistoriaAberta] = useState(null);
  const [historiaInfo, setHistoriaInfo] = useState(null);

  useEffect(() => {
    let ativa = true;
    async function carregarHistorias() {
      try {
        const resposta = await fetch(`${API_BASE_URL}/historias`, {
          headers: { Authorization: `Bearer ${obterToken()}` },
        });
        if (!resposta.ok) throw new Error('Não foi possível carregar as histórias.');
        const historias = await resposta.json();
        if (ativa) setStories(historias);
      } catch (erro) {
        if (ativa) setErro(erro.message);
      }
    }
    carregarHistorias();
    return () => { ativa = false; };
  }, []);

  if (historiaAberta) return <LivroHistoria historia={historiaAberta} onVoltar={() => setHistoriaAberta(null)} onNavigate={onNavigate} />;

  return <main className="app-shell"><AppHeader active="historias" onNavigate={onNavigate} />
    <section className="page-content stories-page">
      <section className="stories-intro"><img src="/images/ilustra-historias.png" alt="" /><div><span>Hora da história</span><h1>Vamos ler juntos?</h1><p>Escolha uma história ou parlenda e acompanhe a leitura palavra por palavra.</p></div></section>
      <h2 className="section-title">Escolha uma leitura</h2>
      {erro ? <p className="form-message" role="alert">{erro}</p> : <div className="story-grid">{stories.map((historia) => <article className={`story-card story-card-${historia.tema}`} key={historia.id}><button className="story-card-open" type="button" onClick={() => setHistoriaAberta(historia)} aria-label={`Abrir a história ${historia.title}`}><span className={`story-level story-level-${historia.nivelClasse}`}>{historia.nivel}</span><i>{historia.icon}</i><strong>{historia.title}</strong><small>{historia.tag}</small><em>{historia.time}</em></button><button className="story-info-button" type="button" onClick={() => setHistoriaInfo(historia)} aria-label={`Informações sobre ${historia.title}`} title="Sobre esta história">i</button></article>)}</div>}
      <p className="parent-note">A história foi criada para o Clubinho ABC. Novas leituras serão adicionadas gradualmente.</p>
    </section>
    {historiaInfo && <InformacoesHistoria historia={historiaInfo} onClose={() => setHistoriaInfo(null)} />}
    <AppFooter />
  </main>;
}
