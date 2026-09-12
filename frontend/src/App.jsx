import { useState } from 'react';
import CacaAsLetras from './jogos/CacaAsLetras';

const pets = ['🦊', '🐨', '🐥', '🦕', '🐙', '🐝'];
const ages = ['6 anos', '7 anos'];

function Brand() {
  return (
    <a className="brand" href="#inicio" aria-label="Clubinho ABC">
      <span className="brand-mark">Aa</span>
      <span>CLUBINHO <strong>ABC</strong></span>
    </a>
  );
}

function SignupSteps({ step }) {
  const labels = ['Responsável', 'A criança', 'Tudo pronto'];

  return (
    <aside className="signup-aside">
      <div>
        <h1>Três passinhos e a aventura começa</h1>
        <p>A gente monta a trilha de letras certinha para a idade da sua criança.</p>
      </div>
      <ol className="step-list">
        {labels.map((label, index) => {
          const currentStep = index + 1;
          const complete = currentStep < step;
          return (
            <li className={currentStep === step ? 'active' : complete ? 'done' : ''} key={label}>
              <span>{complete ? '✓' : currentStep}</span>{label}
            </li>
          );
        })}
      </ol>
      <img src="/images/mascote.png" alt="" className="signup-mascot" />
    </aside>
  );
}

function Signup({ onBackToLogin, onFinish }) {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('6 anos');
  const [pet, setPet] = useState(pets[0]);
  const [message, setMessage] = useState('');

  const previousStep = () => setStep((current) => Math.max(1, current - 1));

  function advance(event) {
    event.preventDefault();
    setStep((current) => Math.min(3, current + 1));
  }

  return (
    <main className="page-shell signup-page" id="inicio">
      <div className="shape shape-top-left" />
      <div className="shape shape-bottom-left" />
      <header className="site-header compact-header">
        <Brand />
        <button className="text-link" type="button" onClick={onBackToLogin}>Já tenho conta</button>
      </header>

      <section className="signup-layout" aria-label="Criar conta da família">
        <SignupSteps step={step} />
        <section className={`signup-card step-${step}`}>
          {step === 1 && (
            <form onSubmit={advance}>
              <span className="step-label">Passo 1 de 3</span>
              <h2>Quem cuida da aventura?</h2>
              <label htmlFor="guardian-name">Seu nome</label>
              <input id="guardian-name" placeholder="Ana Paula" />
              <label htmlFor="guardian-email">E-mail</label>
              <input id="guardian-email" type="email" placeholder="voce@email.com" />
              <label htmlFor="guardian-password">Criar senha</label>
              <input id="guardian-password" type="password" placeholder="mínimo 8 caracteres" />
              <button className="small-primary" type="submit">Continuar <span>→</span></button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={advance}>
              <span className="step-label">Passo 2 de 3</span>
              <h2>Agora, a estrelinha da casa</h2>
              <label htmlFor="child-name">Nome da criança</label>
              <input id="child-name" placeholder="Manu" />
              <fieldset>
                <legend>Idade</legend>
                <div className="choice-row age-choices">
                  {ages.map((item) => <button className={age === item ? 'selected' : ''} onClick={() => setAge(item)} type="button" key={item}>🗓 &nbsp;{item}</button>)}
                </div>
              </fieldset>
              <fieldset>
                <legend>Escolha um bichinho</legend>
                <div className="choice-row pet-choices">
                  {pets.map((item) => <button className={pet === item ? 'selected' : ''} onClick={() => setPet(item)} type="button" aria-label={`Escolher ${item}`} key={item}>{item}</button>)}
                </div>
              </fieldset>
              <div className="signup-actions">
                <button className="back-button" type="button" onClick={previousStep}>← &nbsp; Voltar</button>
                <button className="small-primary" type="submit">Continuar <span>→</span></button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="ready-step">
              <span className="step-label">Passo 3 de 3</span>
              <div className="chosen-pet">{pet}</div>
              <h2>Tudo pronto!</h2>
              <p>A trilha das letras foi montada. É só entrar e começar a brincar.</p>
              <div className="trail-tags"><span>✣ Letras do nome</span><span>✣ Sílabas mágicas</span><span>✣ Primeiras palavras</span></div>
              <div className="signup-actions">
                <button className="back-button" type="button" onClick={previousStep}>← &nbsp; Voltar</button>
                <button className="small-primary" type="button" onClick={onFinish}>Começar a aventura <span>→</span></button>
              </div>
              {message && <p className="form-message" role="status">{message}</p>}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Login({ onCreateAccount, onLogin }) {

  function submitLogin(event) {
    event.preventDefault();
    onLogin();
  }

  return (
    <main className="page-shell" id="inicio">
      <div className="shape shape-top-left" />
      <div className="shape shape-bottom-left" />
      <div className="shape shape-right" />
      <header className="site-header">
        <Brand />
        <button className="account-link" type="button" onClick={onCreateAccount}>Criar conta grátis</button>
      </header>

      <section className="content-grid">
        <section className="welcome-panel" aria-label="Apresentação do Clubinho ABC">
          <div className="stat-card stat-activities"><span>☆</span><b>+120</b><small>atividades</small></div>
          <div className="learning-orb"><img src="/images/cena-alfabeto.png" alt="Crianças aprendendo letras de forma divertida" /></div>
          <div className="stat-card stat-games"><span>🎮</span><b>32 jogos</b><small>para brincar</small></div>
          <p className="about"><span>♡</span> Feito com educadores para crianças de 6 a 7 anos — trilhas de letras, sílabas e primeiras palavras.</p>
        </section>

        <section className="login-card" aria-labelledby="login-title">
          <img src="/images/mascote.png" alt="" className="login-mascot" />
          <span className="welcome-label">Bem-vindo de volta!</span>
          <h1 id="login-title">Vamos <em>aprender</em> hoje?</h1>
          <p className="card-intro">Entre para continuar a aventura das letras.</p>
          <form onSubmit={submitLogin}>
            <label htmlFor="email">E-mail do responsável</label>
            <input id="email" type="email" placeholder="voce@email.com" />
            <label htmlFor="password">Senha</label>
            <input id="password" type="password" placeholder="••••••••" />
            <div className="form-options">
              <label className="remember"><input type="checkbox" /> Lembrar de mim</label>
              <button type="button" className="forgot">Esqueci a senha</button>
            </div>
            <button className="primary-button" type="submit">Entrar e brincar <span>→</span></button>
          </form>
          <div className="divider"><span />ou<span /></div>
          <button className="secondary-button" type="button" onClick={onCreateAccount}>♧ &nbsp; Criar conta da família</button>
          <p className="safety-text">Ambiente seguro, sem anúncios e com controle dos responsáveis.</p>
        </section>
      </section>
    </main>
  );
}

const navItems = [
  ['início', '⛱️', 'Início'],
  ['jogos', '🎮', 'Jogos'],
  ['historias', '📚', 'Histórias'],
  ['atividades', '🖍️', 'Atividades'],
  ['progresso', '🛝', 'Progresso'],
];

function AppHeader({ active, onNavigate }) {
  return (
    <header className="app-header">
      <Brand />
      <nav className="app-nav" aria-label="Navegação principal">
        {navItems.map(([id, icon, label]) => (
          <button className={active === id ? 'active' : ''} type="button" key={id} onClick={() => onNavigate(id)}>
            <span aria-hidden="true">{icon}</span>{label}
          </button>
        ))}
      </nav>
      <div className="profile-summary">
        <span className="streak">♨ <b>7 dias</b></span>
        <span className="stars">✣ <b>1.240 estrelas</b></span>
        <button className="child-profile" type="button"><img src="/images/mascote.png" alt="" />Manu</button>
      </div>
    </header>
  );
}

function Stat({ icon, value, label, tone }) {
  return <article className="journey-stat"><span className={`stat-icon ${tone}`}>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>;
}

function Home({ onNavigate }) {
  const cards = [
    ['Jogar', 'ilustra-jogos.png', '32', 'jogos'],
    ['Histórias', 'ilustra-historias.png', '', 'historias'],
    ['Aprender', 'ilustra-aprender.png', '', 'inicio'],
    ['Atividades', 'ilustra-atividades.png', '', 'atividades'],
    ['Conquistas', 'ilustra-conquistas.png', '3', 'progresso'],
    ['Jornada', 'ilustra-progresso.png', '', 'progresso'],
  ];
  return (
    <main className="app-shell">
      <AppHeader active="início" onNavigate={onNavigate} />
      <section className="home-content">
        <div className="journey-heading"><img src="/images/ilustra-progresso.png" alt="" /><div><span>Acompanhamento</span><h1>A jornada da Manu</h1></div></div>
        <div className="journey-stats">
          <Stat icon="☆" value="1.240" label="estrelas ganhas" tone="yellow" />
          <Stat icon="♨" value="7" label="dias seguidos" tone="orange" />
          <Stat icon="◷" value="18 min" label="por dia" tone="blue" />
          <Stat icon="▢" value="34" label="palavras lidas" tone="pink" />
        </div>
        <section className="adventure-map" aria-labelledby="map-title">
          <div className="map-banner"><div><h2 id="map-title">Mapa da aventura</h2><p>Manu está atravessando a Ponte das Sílabas.</p></div><img src="/images/mascote.png" alt="Manu, a mascote" /></div>
          <ol className="trail">
            <li className="finished"><span>✓</span><b>Ilha das Vogais</b><small>100%</small></li>
            <li className="finished"><span>✓</span><b>Vale do Alfabeto</b><small>100%</small></li>
            <li className="current"><span>3</span><b>Ponte das Sílabas</b><small>60%</small></li>
            <li className="locked"><span>♧</span><b>Floresta das Palavras</b><small>a descobrir</small></li>
            <li className="locked"><span>♧</span><b>Castelo das Frases</b><small>a descobrir</small></li>
          </ol>
        </section>
        <section className="play-hero">
          <img src="/images/mascote.png" alt="" />
          <div><span>◖ Oi, Manu!</span><h2>Vamos brincar de ler?</h2><div className="syllables"><i>⛺</i><i>BA</i><i>BE</i><i>BI</i></div><button type="button" onClick={() => onNavigate('jogos')}>▶ <b>Começar</b></button></div>
        </section>
        <section className="shortcut-grid" aria-label="Atalhos do Clubinho">
          {cards.map(([title, image, badge, id]) => <button className="shortcut-card" type="button" onClick={() => onNavigate(id)} key={title}>{badge && <em>{badge}</em>}<img src={`/images/${image}`} alt="" /><strong>{title}</strong></button>)}
        </section>
      </section>
    </main>
  );
}

function PlayButton({ children = 'Jogar' }) { return <button className="round-play" type="button">▶ <b>{children}</b></button>; }

const stories = [['🐳', 'A Baleia Bela', 'BA · BE', '4 min'], ['🦥', 'Bia e o Bicho-preguiça', 'BI', '5 min'], ['🎪', 'O Circo do Bê', 'BÊ · BA', '6 min'], ['🍇', 'A Uva que Voou', 'Vogais', '4 min'], ['🌼', 'Dente de Leão', 'DE · DI', '7 min'], ['🔒', 'O Soninho da Lua', 'Ninar', '8 min']];
function Stories({ onNavigate }) {
  return <main className="app-shell"><AppHeader active="historias" onNavigate={onNavigate} />
    <section className="page-content stories-page"><section className="story-hero"><div><span>◔ Hora da história</span><h1>O Soninho da Lua</h1><div className="story-tags"><i>🌙</i><i>🦊</i><i>⭐</i></div><PlayButton children="Ouvir" /><small>♧ &nbsp; 8 min</small></div><img src="/images/ilustra-historias.png" alt="Ilustração da história" /></section>
      <h2 className="section-title">✣ Escolha uma história</h2><div className="story-grid">{stories.map(([icon, title, tag, time]) => <article className="story-card" key={title}><span>{tag}</span><i>{icon}</i><strong>{title}</strong><small>♧ {time}</small></article>)}</div><p className="parent-note">Para os responsáveis: todas as histórias têm narração em áudio e usam as letras e sílabas da fase atual da trilha.</p>
    </section>
  </main>;
}

const activities = [['▤', 'Caligrafia das vogais', 'Ficha para imprimir · 8 páginas', 'orange'], ['✂', 'Recorte e cole: sílabas', 'Atividade manual · 6 páginas', 'blue'], ['🎨', 'Pinte a letra inicial', 'Colorir · 12 páginas', 'yellow'], ['▤', 'Cruzadinha de animais', 'Ficha para imprimir · 4 páginas', 'blue'], ['✂', 'Alfabeto móvel', 'Atividade manual · 3 páginas', 'orange']];
function Activities({ onNavigate }) {
  const [filter, setFilter] = useState('Todas');
  return <main className="app-shell"><AppHeader active="atividades" onNavigate={onNavigate} />
    <section className="page-content activities-page"><span className="eyebrow">Para fazer junto</span><h1>Atividades e materiais</h1><p className="page-intro">Selecionadas por professoras alfabetizadoras. Baixe, imprima e faça com a criança — offline também vale aprendizado.</p>
      <section className="activity-feature"><div><span>Kit da semana</span><h2>Caderno BA-BE-BI completo</h2><p>22 páginas com traçado, colagem e leitura em voz alta, no ritmo da trilha atual da Manu.</p><button>⇩ &nbsp; Baixar PDF</button><button className="outline">▣ &nbsp; Imprimir</button></div><b>✏️</b></section>
      <div className="filter-row">{['Todas', 'Para imprimir', 'Colorir', 'Recortar', 'Concluídas'].map(item => <button className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)} type="button" key={item}>{item}</button>)}</div>
      <div className="activity-grid">{activities.map(([icon, title, desc, tone]) => <article className="activity-card" key={title}><span className={`activity-icon ${tone}`}>{icon}</span><em>✓ Feita</em><h2>{title}</h2><p>{desc}</p><button>⇩ &nbsp; Baixar</button><button className="print">▣</button></article>)}</div>
    </section>
  </main>;
}

function Progress({ onNavigate }) {
  const mastery = [['Reconhecer vogais', '100%'], ['Letras do alfabeto', '82%'], ['Sílabas simples', '60%'], ['Leitura de palavras', '35%'], ['Escrita espontânea', '18%']];
  const medals = [['🏅', 'Mestre das vogais'], ['⭐', '7 dias seguidos'], ['📖', 'Primeira leitura'], ['🚀', '50 palavras'], ['♛', 'Rei das sílabas'], ['🌈', 'Trilha completa']];
  return <main className="app-shell"><AppHeader active="progresso" onNavigate={onNavigate} />
    <section className="page-content progress-page"><div className="journey-heading"><img src="/images/ilustra-progresso.png" alt="" /><div><span>Acompanhamento</span><h1>A jornada da Manu</h1></div></div><div className="journey-stats"><Stat icon="☆" value="1.240" label="estrelas ganhas" tone="yellow" /><Stat icon="♨" value="7" label="dias seguidos" tone="orange" /><Stat icon="◷" value="18 min" label="por dia" tone="blue" /><Stat icon="▢" value="34" label="palavras lidas" tone="pink" /></div>
      <section className="adventure-map"><div className="map-banner"><div><h2>Mapa da aventura</h2><p>Manu está atravessando a Ponte das Sílabas.</p></div><img src="/images/mascote.png" alt="" /></div><ol className="trail"><li className="finished"><span>✓</span><b>Ilha das Vogais</b><small>100%</small></li><li className="finished"><span>✓</span><b>Vale do Alfabeto</b><small>100%</small></li><li className="current"><span>3</span><b>Ponte das Sílabas</b><small>60%</small></li><li className="locked"><span>♧</span><b>Floresta das Palavras</b><small>a descobrir</small></li><li className="locked"><span>♧</span><b>Castelo das Frases</b><small>a descobrir</small></li></ol></section>
      <div className="progress-bottom"><section className="mastery"><h2>O que a Manu já domina</h2>{mastery.map(([name, value]) => <div className="mastery-row" key={name}><strong>{name}</strong><em>{value}</em><span><i style={{ width: value }} /></span></div>)}</section><section className="medals"><h2>Medalhas <span>3 de 6 conquistadas</span></h2><div>{medals.map(([icon, title], index) => <article className={index > 2 ? 'locked-medal' : ''} key={title}><i>{icon}</i><small>{title}</small></article>)}</div></section></div>
    </section>
  </main>;
}

function App() {
  const [view, setView] = useState('login');
  const navigate = (page) => setView(page === 'início' || page === 'inicio' ? 'home' : page);

  if (view === 'signup') return <Signup onBackToLogin={() => setView('login')} onFinish={() => setView('home')} />;
  if (view === 'home') return <Home onNavigate={navigate} />;
  if (view === 'jogos') return <CacaAsLetras Cabecalho={AppHeader} onNavigate={navigate} />;
  if (view === 'historias') return <Stories onNavigate={navigate} />;
  if (view === 'atividades') return <Activities onNavigate={navigate} />;
  if (view === 'progresso') return <Progress onNavigate={navigate} />;
  return <Login onCreateAccount={() => setView('signup')} onLogin={() => setView('home')} />;
}

export default App;
