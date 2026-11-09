import { useState } from 'react';
import TermosDeUso from '../../TermosDeUso';
import PoliticaDePrivacidade from '../../PoliticaDePrivacidade';
import { atualizarSenha, cadastrar, entrar, enviarRecuperacaoSenha, reenviarConfirmacao } from '../../utils/auth';

const pets = ['🦊', '🐨', '🐥', '🦕', '🐙', '🐝'];
const hojeLocal = () => new Date().toLocaleDateString('sv-SE');
const REQUISITOS_SENHA = 'Mínimo de 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula, um número e um símbolo.';
const ERRO_SENHA = 'Sua senha ainda não atende aos requisitos.';

function senhaAtendeRequisitos(senha) {
  return senha.length >= 8
    && /[a-z]/.test(senha)
    && /[A-Z]/.test(senha)
    && /\d/.test(senha)
    && /[^A-Za-z0-9\s]/.test(senha);
}

export function CampoSenha({ id, value, onChange, placeholder, autoComplete = 'new-password' }) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="password-input">
      <input
        id={id}
        type={visivel ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        minLength={8}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        onClick={() => setVisivel((atual) => !atual)}
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visivel}
        title={visivel ? 'Ocultar senha' : 'Mostrar senha'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {visivel ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c5.5 0 9.3 4.5 10 6-0.3.7-1.3 2.1-2.9 3.4M6.7 6.7C4.3 8.2 2.6 10.6 2 12c.7 1.5 4.5 6 10 6 1 0 1.9-.1 2.7-.4M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </>
          ) : (
            <>
              <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}

export function CamposCrianca({ nome, setNome, dataNascimento, setDataNascimento, pet, setPet, idPrefixo = 'child' }) {
  return (
    <>
      <label htmlFor={`${idPrefixo}-name`}>Nome da criança</label>
      <input id={`${idPrefixo}-name`} placeholder="Manu" value={nome} onChange={(event) => setNome(event.target.value)} required />
      <label htmlFor={`${idPrefixo}-birth`}>Data de nascimento</label>
      <input id={`${idPrefixo}-birth`} type="date" max={hojeLocal()} value={dataNascimento} onChange={(event) => setDataNascimento(event.target.value)} required />
      <fieldset>
        <legend>Escolha um bichinho</legend>
        <div className="choice-row pet-choices">
          {pets.map((item) => <button className={pet === item ? 'selected' : ''} onClick={() => setPet(item)} type="button" aria-label={`Escolher ${item}`} key={item}>{item}</button>)}
        </div>
      </fieldset>
    </>
  );
}

export function Brand() {
  return (
    <a className="brand" href="#inicio" aria-label="Clubinho ABC">
      <span className="brand-mark"><img src="/images/mascote.png" alt="" /></span>
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
        <p>A gente monta a trilha de letras para crianças de 6 a 7 anos.</p>
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

export function Signup({ onBackToLogin, onFinish }) {
  const [step, setStep] = useState(1);
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianPassword, setGuardianPassword] = useState('');
  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [pet, setPet] = useState(pets[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const previousStep = () => setStep((current) => Math.max(1, current - 1));

  function advance(event) {
    event.preventDefault();
    setMessage('');
    if (step === 1 && !senhaAtendeRequisitos(guardianPassword)) {
      setMessage(ERRO_SENHA);
      return;
    }
    setStep((current) => Math.min(3, current + 1));
  }

  async function finalizarCadastro() {
    if (!senhaAtendeRequisitos(guardianPassword)) {
      setStep(1);
      setMessage(ERRO_SENHA);
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await cadastrar({
        nome: guardianName,
        email: guardianEmail,
        senha: guardianPassword,
        criancaNome: childName,
        criancaDataNascimento: birthDate,
        criancaAvatar: pet,
      });
      onFinish(guardianEmail);
    } catch (erro) {
      setMessage(erro.message);
    } finally {
      setSubmitting(false);
    }
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
              <input id="guardian-name" placeholder="Ana Paula" value={guardianName} onChange={(event) => setGuardianName(event.target.value)} required />
              <label htmlFor="guardian-email">E-mail</label>
              <input id="guardian-email" type="email" placeholder="voce@email.com" value={guardianEmail} onChange={(event) => setGuardianEmail(event.target.value)} required />
              <label htmlFor="guardian-password">Criar senha</label>
              <CampoSenha id="guardian-password" placeholder="Crie uma senha forte" value={guardianPassword} onChange={(event) => setGuardianPassword(event.target.value)} />
              <p className="field-hint">{REQUISITOS_SENHA}</p>
              {message && <p className="form-message" role="alert">{message}</p>}
              <div className="terms-acceptance">
                <input id="accept-terms" type="checkbox" required />
                <label htmlFor="accept-terms">Sou responsável pela criança e li e aceito os</label>
                <button type="button" onClick={() => setShowTerms(true)}>Termos e Condições de Uso</button>
              </div>
              <button className="small-primary" type="submit">Continuar <span>→</span></button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={advance}>
              <span className="step-label">Passo 2 de 3</span>
              <h2>Agora, a estrelinha da casa</h2>
              <CamposCrianca nome={childName} setNome={setChildName} dataNascimento={birthDate} setDataNascimento={setBirthDate} pet={pet} setPet={setPet} />
              <p className="field-hint">Você poderá cadastrar outras crianças depois de entrar.</p>
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
              <div className="trail-tags"><span>⭐ Letras do nome</span><span>⭐ Sílabas mágicas</span><span>⭐ Primeiras palavras</span></div>
              <div className="signup-actions">
                <button className="back-button" type="button" onClick={previousStep} disabled={submitting}>← &nbsp; Voltar</button>
                <button className="small-primary" type="button" onClick={finalizarCadastro} disabled={submitting}>
                  {submitting ? 'Criando conta…' : <>Começar a aventura <span>→</span></>}
                </button>
              </div>
              {message && <p className="form-message" role="alert">{message}</p>}
            </div>
          )}
          <button className="terms-link" type="button" onClick={() => setShowPrivacy(true)}>Política de Privacidade</button>
        </section>
      </section>
      {showTerms && <TermosDeUso onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PoliticaDePrivacidade onClose={() => setShowPrivacy(false)} />}
    </main>
  );
}

function EsqueciSenha({ emailInicial, onVoltar }) {
  const [email, setEmail] = useState(emailInicial);
  const [message, setMessage] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function enviar(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await enviarRecuperacaoSenha(email);
      setEnviado(true);
    } catch (erro) {
      setMessage(erro.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (enviado) {
    return (
      <div className="forgot-password-panel">
        <p className="form-message" role="status">Enviamos um link para {email}. Abra o e-mail e siga as instruções para criar uma nova senha.</p>
        <button className="text-link" type="button" onClick={onVoltar}>Voltar para o login</button>
      </div>
    );
  }

  return (
    <form className="forgot-password-panel" onSubmit={enviar}>
      <label htmlFor="forgot-email">Informe o e-mail da conta</label>
      <input id="forgot-email" type="email" placeholder="voce@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
      {message && <p className="form-message" role="alert">{message}</p>}
      <div className="signup-actions">
        <button className="back-button" type="button" onClick={onVoltar} disabled={submitting}>← &nbsp; Voltar</button>
        <button className="small-primary" type="submit" disabled={submitting}>{submitting ? 'Enviando…' : 'Enviar link'}</button>
      </div>
    </form>
  );
}

export function Login({ onCreateAccount, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function submitLogin(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await entrar(email, password);
      onLogin();
    } catch (erro) {
      setMessage(erro.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell" id="inicio">
      <div className="shape shape-top-left" />
      <div className="shape shape-bottom-left" />
      <div className="shape shape-right" />
      <header className="site-header">
        <Brand />
      </header>

      <section className="content-grid">
        <section className="welcome-panel" aria-label="Apresentação do Clubinho ABC">
          <div className="stat-card stat-activities"><span>☆</span><b>Atividades</b></div>
          <div className="learning-orb"><img src="/images/cena-alfabeto.png" alt="Crianças aprendendo letras de forma divertida" /></div>
          <div className="stat-card stat-stories"><span>📚</span><b>Histórias</b></div>
          <div className="stat-card stat-games"><span>🎮</span><b>Jogos</b></div>
          <p className="about"><span>♡</span> Para crianças de 6 a 7 anos, com trilhas de letras, sílabas e primeiras palavras.</p>
        </section>

        <section className="login-card" aria-labelledby="login-title">
          <img src="/images/mascote.png" alt="" className="login-mascot" />
          <span className="welcome-label">Bem-vindo de volta!</span>
          <h1 id="login-title">Vamos <em>aprender</em> hoje?</h1>
          <p className="card-intro">Entre para continuar a aventura das letras.</p>
          {showForgot ? (
            <EsqueciSenha emailInicial={email} onVoltar={() => setShowForgot(false)} />
          ) : (
            <form onSubmit={submitLogin}>
              <label htmlFor="email">E-mail do responsável</label>
              <input id="email" type="email" placeholder="voce@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <label htmlFor="password">Senha</label>
              <input id="password" type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <div className="form-options">
                <button type="button" className="forgot" onClick={() => setShowForgot(true)}>Esqueci a senha</button>
              </div>
              {message && <p className="form-message" role="alert">{message}</p>}
              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting ? 'Entrando…' : <>Entrar e brincar <span>→</span></>}
              </button>
            </form>
          )}
          <div className="divider"><span />ou<span /></div>
          <button className="secondary-button" type="button" onClick={onCreateAccount}>♧ &nbsp; Criar conta da família</button>
          <p className="safety-text">Ambiente seguro, sem anúncios e com controle dos responsáveis.</p>
          <button className="terms-link" type="button" onClick={() => setShowTerms(true)}>Termos e Condições de Uso</button>
          <button className="terms-link" type="button" onClick={() => setShowPrivacy(true)}>Política de Privacidade</button>
        </section>
      </section>
      {showTerms && <TermosDeUso onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PoliticaDePrivacidade onClose={() => setShowPrivacy(false)} />}
    </main>
  );
}

export function ConfirmeSeuEmail({ email, onVoltar }) {
  const [message, setMessage] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function reenviar() {
    setEnviando(true);
    setMessage('');
    try {
      await reenviarConfirmacao(email);
      setMessage('Reenviamos o link de confirmação.');
    } catch (erro) {
      setMessage(erro.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="page-shell" id="inicio">
      <div className="shape shape-top-left" />
      <div className="shape shape-bottom-left" />
      <header className="site-header compact-header">
        <Brand />
      </header>
      <section className="content-grid single-card">
        <section className="login-card" aria-labelledby="confirm-title">
          <img src="/images/mascote.png" alt="" className="login-mascot" />
          <h1 id="confirm-title">Confirme seu <em>e-mail</em></h1>
          <p className="card-intro">Mandamos um link de confirmação para {email || 'o seu e-mail'}. Abra a mensagem e clique no link para ativar a conta da família — só depois disso dá pra entrar.</p>
          {message && <p className="form-message" role="status">{message}</p>}
          <button className="secondary-button" type="button" onClick={onVoltar}>Já confirmei, ir para o login</button>
          {email && (
            <button className="text-link" type="button" onClick={reenviar} disabled={enviando}>
              {enviando ? 'Reenviando…' : 'Não chegou? Reenviar e-mail'}
            </button>
          )}
        </section>
      </section>
    </main>
  );
}

export function RedefinirSenha() {
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function salvar(event) {
    event.preventDefault();
    if (!senhaAtendeRequisitos(senha)) {
      setMessage(ERRO_SENHA);
      return;
    }
    if (senha !== confirmacao) {
      setMessage('As senhas não são iguais.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await atualizarSenha(senha);
    } catch (erro) {
      setMessage(erro.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell" id="inicio">
      <div className="shape shape-top-left" />
      <div className="shape shape-bottom-left" />
      <header className="site-header compact-header">
        <Brand />
      </header>
      <section className="content-grid single-card">
        <section className="login-card" aria-labelledby="reset-title">
          <img src="/images/mascote.png" alt="" className="login-mascot" />
          <h1 id="reset-title">Crie uma <em>nova senha</em></h1>
          <form onSubmit={salvar}>
            <label htmlFor="new-password">Nova senha</label>
            <CampoSenha id="new-password" placeholder="Crie uma senha forte" value={senha} onChange={(event) => setSenha(event.target.value)} />
            <p className="field-hint">{REQUISITOS_SENHA}</p>
            <label htmlFor="new-password-confirm">Confirme a nova senha</label>
            <CampoSenha id="new-password-confirm" placeholder="digite de novo" value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} />
            {message && <p className="form-message" role="alert">{message}</p>}
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}


