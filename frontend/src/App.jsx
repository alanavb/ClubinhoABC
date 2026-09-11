import { useState } from 'react';

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

function Signup({ onBackToLogin }) {
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
                <button className="small-primary" type="button" onClick={() => setMessage('A tela de início será a próxima etapa do front-end.')}>Começar a aventura <span>→</span></button>
              </div>
              {message && <p className="form-message" role="status">{message}</p>}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Login({ onCreateAccount }) {
  const [message, setMessage] = useState('');

  function submitLogin(event) {
    event.preventDefault();
    setMessage('O login será conectado quando o back-end fizer parte do projeto.');
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
          {message && <p className="form-message" role="status">{message}</p>}
          <div className="divider"><span />ou<span /></div>
          <button className="secondary-button" type="button" onClick={onCreateAccount}>♧ &nbsp; Criar conta da família</button>
          <p className="safety-text">Ambiente seguro, sem anúncios e com controle dos responsáveis.</p>
        </section>
      </section>
    </main>
  );
}

function App() {
  const [view, setView] = useState('login');
  return view === 'signup'
    ? <Signup onBackToLogin={() => setView('login')} />
    : <Login onCreateAccount={() => setView('signup')} />;
}

export default App;
