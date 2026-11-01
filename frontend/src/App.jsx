import { useEffect, useRef, useState } from 'react';
import AreaDeJogos from './jogos/AreaDeJogos';
import TermosDeUso from './TermosDeUso';
import PoliticaDePrivacidade from './PoliticaDePrivacidade';
import {
  adicionarCrianca,
  aoMudarSessao,
  atualizarSenha,
  cadastrar,
  confirmarSenhaResponsavel,
  editarCrianca,
  excluirCrianca,
  entrar,
  enviarRecuperacaoSenha,
  estaAutenticado,
  obterCriancaId,
  obterCriancaSelecionada,
  obterPerfil,
  perfilCompleto,
  precisaRedefinirSenha,
  reenviarConfirmacao,
  sair,
  selecionarCrianca,
} from './utils/auth';
import { useResumoProgresso } from './utils/etapas';

const pets = ['🦊', '🐨', '🐥', '🦕', '🐙', '🐝'];
const hojeLocal = () => new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD no fuso do navegador
const REQUISITOS_SENHA = 'Mínimo de 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula, um número e um símbolo.';
const ERRO_SENHA = 'Sua senha ainda não atende aos requisitos.';

function senhaAtendeRequisitos(senha) {
  return senha.length >= 8
    && /[a-z]/.test(senha)
    && /[A-Z]/.test(senha)
    && /\d/.test(senha)
    && /[^A-Za-z0-9\s]/.test(senha);
}

function CampoSenha({ id, value, onChange, placeholder, autoComplete = 'new-password' }) {
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

function CamposCrianca({ nome, setNome, dataNascimento, setDataNascimento, pet, setPet, idPrefixo = 'child' }) {
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

function Brand() {
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

function Signup({ onBackToLogin, onFinish }) {
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

function Login({ onCreateAccount, onLogin }) {
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

function ConfirmeSeuEmail({ email, onVoltar }) {
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

function RedefinirSenha() {
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

const navItems = [
  ['início', '⛱️', 'Início'],
  ['jogos', '🎮', 'Jogos'],
  ['historias', '📚', 'Histórias'],
  ['atividades', '🖍️', 'Atividades'],
  ['progresso', '🛝', 'Progresso'],
];

function textoIdade(crianca) {
  return crianca.idade == null ? 'idade não informada' : `${crianca.idade} ${crianca.idade === 1 ? 'ano' : 'anos'}`;
}

function textoDataNascimento(dataNascimento) {
  return dataNascimento ? dataNascimento.split('-').reverse().join('/') : 'data não informada';
}

function AvisoFaixaEtaria({ crianca }) {
  if (!crianca?.fora_da_faixa_etaria) return null;
  return (
    <p className="age-warning" role="status">
      <strong>Para o responsável:</strong> {crianca.nome} tem {textoIdade(crianca)}, e o Clubinho ABC é indicado para crianças de 6 a 7 anos.
      Avalie se as atividades ainda fazem sentido para ela. Você pode continuar usando normalmente.
    </p>
  );
}

function MinhaConta({ onNavigate }) {
  const perfil = obterPerfil();
  const criancas = perfil?.criancas ?? [];
  const selecionadaId = obterCriancaId();
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [pet, setPet] = useState(pets[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [criancaEmEdicao, setCriancaEmEdicao] = useState(null);
  const [criancaParaExcluir, setCriancaParaExcluir] = useState(null);
  const [section, setSection] = useState('dados');
  const [securityMessage, setSecurityMessage] = useState('');
  const [securitySubmitting, setSecuritySubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function salvar(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await adicionarCrianca({ nome, dataNascimento, avatar: pet });
      setNome('');
      setDataNascimento('');
      setPet(pets[0]);
    } catch (erro) {
      setMessage(erro.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function solicitarAlteracaoSenha() {
    setSecuritySubmitting(true);
    setSecurityMessage('');
    try {
      await enviarRecuperacaoSenha(perfil?.email);
      setSecurityMessage('Enviamos um link para alterar sua senha no e-mail cadastrado.');
    } catch (erro) {
      setSecurityMessage(erro.message);
    } finally {
      setSecuritySubmitting(false);
    }
  }

  return (
    <main className="app-shell"><AppHeader active="conta" onNavigate={onNavigate} />
      <section className="page-content account-page">
        <div className="account-heading"><span>Minha conta</span><h1>Dados da família</h1><p>Gerencie os dados da sua conta e das crianças vinculadas.</p></div>
        <div className="account-layout">
          <nav className="account-sidebar" aria-label="Seções da conta">
            <button className={section === 'dados' ? 'active' : ''} type="button" onClick={() => setSection('dados')}>Dados da conta</button>
            <button className={section === 'criancas' ? 'active' : ''} type="button" onClick={() => setSection('criancas')}>Crianças</button>
            <button className={section === 'seguranca' ? 'active' : ''} type="button" onClick={() => setSection('seguranca')}>Segurança</button>
            <button className={section === 'privacidade' ? 'active' : ''} type="button" onClick={() => setSection('privacidade')}>Privacidade</button>
          </nav>
          <div className="account-panel">
            {section === 'dados' && <section className="account-card">
              <h2>Dados da conta</h2>
              <p>Estas informações identificam o responsável pela família cadastrada.</p>
              <dl className="account-data-list"><div><dt>Nome</dt><dd>{perfil?.nome}</dd></div><div><dt>E-mail</dt><dd>{perfil?.email}</dd></div></dl>
            </section>}
            {section === 'criancas' && <>
              <h2>Crianças vinculadas</h2>
              <p>Escolha quem vai brincar agora, edite os dados ou cadastre outra criança.</p>
              <ul className="family-list">
                {criancas.map((crianca) => (
                  <li key={crianca.crianca_id}>
                    <button
                      type="button"
                      className={`family-child ${crianca.crianca_id === selecionadaId ? 'selected' : ''}`}
                      aria-pressed={crianca.crianca_id === selecionadaId}
                      onClick={() => selecionarCrianca(crianca.crianca_id)}
                    >
                      <span className="family-pet" aria-hidden="true">{crianca.avatar || '🙂'}</span>
                      <strong>{crianca.nome}</strong>
                      <small>{textoIdade(crianca)} · nascimento: {textoDataNascimento(crianca.data_nascimento)}{crianca.fora_da_faixa_etaria ? ' · fora da faixa de 6 a 7 anos' : ''}</small>
                    </button>
                    <div className="family-actions">
                      <button className="family-edit family-icon-button" type="button" onClick={() => setCriancaEmEdicao(crianca)} aria-label={`Editar dados de ${crianca.nome}`} title="Editar">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>
                      </button>
                      <button className="family-delete family-icon-button" type="button" onClick={() => setCriancaParaExcluir(crianca)} aria-label={`Excluir ${crianca.nome}`} title="Excluir">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <h2>Adicionar criança</h2>
              <form onSubmit={salvar}>
                <CamposCrianca idPrefixo="new-child" nome={nome} setNome={setNome} dataNascimento={dataNascimento} setDataNascimento={setDataNascimento} pet={pet} setPet={setPet} />
                {message && <p className="form-message" role="alert">{message}</p>}
                <button className="small-primary" type="submit" disabled={submitting}>{submitting ? 'Salvando…' : 'Adicionar criança'}</button>
              </form>
            </>}
            {section === 'seguranca' && <section className="account-card">
              <h2>Segurança</h2>
              <h3>Senha</h3>
              <p>A senha é armazenada pelo Supabase Auth e nunca é salva pelo Clubinho ABC.</p>
              <p>Para definir uma nova senha, enviaremos um link seguro para <strong>{perfil?.email}</strong>.</p>
              <button className="account-action-button" type="button" onClick={solicitarAlteracaoSenha} disabled={securitySubmitting}>{securitySubmitting ? 'Enviando…' : 'Alterar senha'}</button>
              {securityMessage && <p className="account-status" role="status">{securityMessage}</p>}
            </section>}
            {section === 'privacidade' && <section className="account-card">
              <h2>Privacidade e conta</h2>
              <p>Para dúvidas sobre seus dados ou os dados das crianças vinculadas, entre em contato com a equipe pelo canal de suporte.</p>
              <a className="account-contact-link" href="mailto:clubinhoabc@gmail.com?subject=D%C3%BAvida%20sobre%20privacidade%20-%20Clubinho%20ABC">Falar sobre privacidade</a>
              <div className="delete-account-panel">
                <h3>Excluir conta</h3>
                <p>A exclusão da conta remove o acesso do responsável e pode tornar indisponíveis os perfis, o histórico e o progresso das crianças vinculadas.</p>
                <p>Para proteger a família, esse pedido é confirmado pela equipe antes de qualquer exclusão.</p>
                <button type="button" onClick={() => setShowDeleteConfirm(true)}>Solicitar exclusão da conta</button>
              </div>
            </section>}
          </div>
        </div>
      </section>
      {criancaEmEdicao && <EditarCriancaDialog crianca={criancaEmEdicao} onClose={() => setCriancaEmEdicao(null)} />}
      {criancaParaExcluir && <ConfirmarExclusaoCrianca crianca={criancaParaExcluir} onClose={() => setCriancaParaExcluir(null)} />}
      {showDeleteConfirm && <ConfirmarExclusaoConta onClose={() => setShowDeleteConfirm(false)} />}
      <AppFooter />
    </main>
  );
}

function ConfirmarResponsavel({ onBack, onConfirmed }) {
  const perfil = obterPerfil();
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function confirmar(event) {
    event.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await confirmarSenhaResponsavel(senha);
      onConfirmed();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="app-shell">
      <AppHeader onNavigate={onBack} />
      <section className="page-content parent-gate-page">
        <section className="parent-gate-card" aria-labelledby="parent-gate-title">
          <div className="parent-gate-hero">
            <div>
              <span>Recado importante</span>
              <h1 id="parent-gate-title">Ops! Esta parte é dos adultos.</h1>
              <p>Chame seu responsável para continuar cuidando da aventura.</p>
            </div>
            <img src="/images/mascote.png" alt="" />
          </div>
          <p className="parent-gate-instruction">Responsável, confirme sua senha para acessar os dados da família.</p>
          <p className="parent-gate-account">Conta: <strong>{perfil?.email}</strong></p>
          <form onSubmit={confirmar}>
            <label htmlFor="parent-password">Senha do responsável</label>
            <CampoSenha id="parent-password" placeholder="Digite sua senha" value={senha} onChange={(event) => setSenha(event.target.value)} autoComplete="current-password" />
            {erro && <p className="form-message" role="alert">{erro}</p>}
            <div className="parent-gate-actions">
              <button className="back-button" type="button" onClick={onBack}>Voltar</button>
              <button className="small-primary" type="submit" disabled={enviando}>{enviando ? 'Confirmando…' : 'Continuar'}</button>
            </div>
          </form>
        </section>
      </section>
      <AppFooter />
    </main>
  );
}

function EditarCriancaDialog({ crianca, onClose }) {
  const [nome, setNome] = useState(crianca.nome);
  const [dataNascimento, setDataNascimento] = useState(crianca.data_nascimento || '');
  const [pet, setPet] = useState(crianca.avatar || pets[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function salvar(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await editarCrianca({ criancaId: crianca.crianca_id, nome, dataNascimento, avatar: pet });
      onClose();
    } catch (erro) {
      setMessage(erro.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="terms-overlay edit-child-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="terms-dialog family-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-child-title">
        <button className="terms-close" type="button" onClick={onClose} aria-label="Fechar edição da criança">×</button>
        <h1 id="edit-child-title">Editar dados da criança</h1>
        <p>Atualize as informações de {crianca.nome}.</p>
        <form onSubmit={salvar}>
          <CamposCrianca idPrefixo="edit-child" nome={nome} setNome={setNome} dataNascimento={dataNascimento} setDataNascimento={setDataNascimento} pet={pet} setPet={setPet} />
          {message && <p className="form-message" role="alert">{message}</p>}
          <button className="small-primary" type="submit" disabled={submitting}>{submitting ? 'Salvando…' : 'Salvar alterações'}</button>
        </form>
      </section>
    </div>
  );
}

function ConfirmarExclusaoCrianca({ crianca, onClose }) {
  const fraseConfirmacao = `EXCLUIR ${crianca.nome}`;
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const confirmacaoCorreta = confirmacao.trim().replace(/\s+/g, ' ') === fraseConfirmacao;

  async function confirmar(event) {
    event.preventDefault();
    setErro('');
    setExcluindo(true);
    try {
      await excluirCrianca({ criancaId: crianca.crianca_id, confirmacao });
      onClose();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="terms-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="terms-dialog delete-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-child-title">
        <button className="terms-close" type="button" onClick={onClose} aria-label="Fechar confirmação de exclusão da criança">×</button>
        <span className="delete-confirm-icon" aria-hidden="true">⚠️</span>
        <h1 id="delete-child-title">Excluir {crianca.nome}?</h1>
        <p>Esta ação remove definitivamente o perfil, as respostas e o progresso de {crianca.nome}. Ela não pode ser desfeita.</p>
        <form onSubmit={confirmar}>
          <label className="delete-confirm-phrase" htmlFor="delete-child-confirmation">Para confirmar, escreva <strong>{fraseConfirmacao}</strong>.</label>
          <input
            id="delete-child-confirmation"
            value={confirmacao}
            onChange={(event) => setConfirmacao(event.target.value)}
            placeholder={fraseConfirmacao}
            autoComplete="off"
          />
          {erro && <p className="form-message" role="alert">{erro}</p>}
          <div className="delete-confirm-actions">
            <button className="back-button" type="button" onClick={onClose} disabled={excluindo}>Cancelar</button>
            <button className="delete-confirm-button" type="submit" disabled={!confirmacaoCorreta || excluindo}>{excluindo ? 'Excluindo…' : 'Excluir definitivamente'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ConfirmarExclusaoConta({ onClose }) {
  const fraseConfirmacao = 'EXCLUIR MINHA CONTA';
  const [confirmacao, setConfirmacao] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const confirmacaoCorreta = confirmacao.trim().replace(/\s+/g, ' ') === fraseConfirmacao;

  function enviarSolicitacao() {
    if (!confirmacaoCorreta || !confirmado) return;
    window.location.href = 'mailto:clubinhoabc@gmail.com?subject=Solicita%C3%A7%C3%A3o%20de%20exclus%C3%A3o%20da%20conta%20Clubinho%20ABC';
    onClose();
  }

  return (
    <div className="terms-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="terms-dialog delete-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
        <button className="terms-close" type="button" onClick={onClose} aria-label="Fechar confirmação de exclusão">×</button>
        <span className="delete-confirm-icon" aria-hidden="true">⚠️</span>
        <h1 id="delete-confirm-title">Solicitar exclusão da conta</h1>
        <p>Esta solicitação será analisada pela equipe para confirmar a identidade do responsável antes de qualquer exclusão.</p>
        <ul>
          <li>O acesso do responsável será encerrado.</li>
          <li>Os perfis, resultados e progresso das crianças vinculadas poderão ser removidos.</li>
          <li>Essa ação pode ser irreversível após a confirmação da equipe.</li>
        </ul>
        <label className="delete-confirm-phrase" htmlFor="delete-account-confirmation">Para continuar, escreva <strong>{fraseConfirmacao}</strong>.</label>
        <input
          id="delete-account-confirmation"
          value={confirmacao}
          onChange={(event) => setConfirmacao(event.target.value)}
          placeholder={fraseConfirmacao}
          autoComplete="off"
        />
        <label className="delete-confirm-check"><input type="checkbox" checked={confirmado} onChange={(event) => setConfirmado(event.target.checked)} /> Entendo as consequências e quero solicitar a exclusão.</label>
        <div className="delete-confirm-actions">
          <button className="back-button" type="button" onClick={onClose}>Cancelar</button>
          <button className="delete-confirm-button" type="button" onClick={enviarSolicitacao} disabled={!confirmacaoCorreta || !confirmado}>Enviar solicitação</button>
        </div>
      </section>
    </div>
  );
}

function AppHeader({ active, onNavigate }) {
  const crianca = obterCriancaSelecionada();
  const nomeCrianca = crianca?.nome || 'Manu';
  const estrelas = useEstrelas(obterCriancaId());

  async function sairDaConta() {
    await sair();
    onNavigate('login');
  }

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
        <span className="stars">⭐ <b>{estrelas} estrelas</b></span>
        <button className="child-profile" type="button" onClick={() => onNavigate('conta')} aria-label="Abrir minha conta">
          <span className="child-avatar" aria-hidden="true">{crianca?.avatar || '🙂'}</span>{nomeCrianca}
        </button>
        <button className="text-link" type="button" onClick={sairDaConta}>Sair</button>
      </div>
    </header>
  );
}

function AppFooter() {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showContact, setShowContact] = useState(false);

  return (
    <footer className="app-footer">
      <span>Clubinho ABC</span>
      <div>
        <button type="button" onClick={() => setShowTerms(true)}>Termos de Uso</button>
        <button type="button" onClick={() => setShowPrivacy(true)}>Política de Privacidade</button>
        <button type="button" onClick={() => setShowContact(true)}>Contato</button>
      </div>
      {showTerms && <TermosDeUso onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PoliticaDePrivacidade onClose={() => setShowPrivacy(false)} />}
      {showContact && <ContactDialog onClose={() => setShowContact(false)} />}
    </footer>
  );
}

function ContactDialog({ onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="terms-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="terms-dialog contact-dialog" role="dialog" aria-modal="true" aria-labelledby="contact-title">
        <button className="terms-close" type="button" onClick={onClose} aria-label="Fechar contato">×</button>
        <span className="contact-dialog-icon" aria-hidden="true">💌</span>
        <h1 id="contact-title">Fale com a gente</h1>
        <p>Precisa de ajuda, quer enviar uma sugestão ou encontrou alguma dificuldade? A equipe do Clubinho ABC está à disposição para ouvir você.</p>
        <p>Envie sua mensagem para:</p>
        <a className="contact-dialog-email" href="mailto:clubinhoabc@gmail.com?subject=Contato%20pelo%20Clubinho%20ABC">clubinhoabc@gmail.com</a>
        <p className="contact-dialog-note">Para proteger sua conta, não envie senhas, códigos de confirmação ou outras credenciais por e-mail.</p>
      </section>
    </div>
  );
}

function Stat({ icon, value, label, tone }) {
  return <article className="journey-stat"><span className={`stat-icon ${tone}`}>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></article>;
}

function useEstrelas(criancaId) {
  return useResumoProgresso(criancaId).resumo?.estrelas ?? 0;
}

function IndicadoresProgresso({ resumo, erro, recarregar }) {
  if (erro) {
    return <p className="form-message" role="alert">Não foi possível carregar o progresso. <button className="text-link" type="button" onClick={recarregar}>Tentar de novo</button></p>;
  }
  const etapas = resumo?.etapas ?? [];
  const atual = etapas.find((etapa) => etapa.situacao === 'atual');
  const carregando = !resumo;
  const valor = (texto) => (carregando ? '…' : texto);
  return (
    <div className="journey-stats" aria-busy={carregando}>
      <Stat icon="🏁" value={valor(atual?.nome ?? 'Trilha completa')} label="etapa atual" tone="blue" />
      <Stat icon="%" value={valor(`${atual?.percentual ?? 100}%`)} label="da etapa atual" tone="pink" />
      <Stat icon="✓" value={valor(resumo?.atividades_concluidas)} label="atividades concluídas" tone="orange" />
      <Stat icon="⭐" value={valor(resumo?.estrelas)} label="estrelas ganhas" tone="yellow" />
    </div>
  );
}

function Conquistas({ conquistas }) {
  if (!conquistas) return null;
  const ganhas = conquistas.filter((conquista) => conquista.conquistada).length;
  return (
    <section className="medals">
      <h2>Conquistas <span>{ganhas} de {conquistas.length}</span></h2>
      <div>{conquistas.map((conquista) => (
        <article className={conquista.conquistada ? '' : 'locked-medal'} key={conquista.id} aria-label={`${conquista.titulo}: ${conquista.conquistada ? 'conquistada' : 'ainda não conquistada'}`}>
          <i aria-hidden="true">{conquista.icone}</i><small>{conquista.titulo}</small>
        </article>
      ))}</div>
    </section>
  );
}

function MapaAventura({ nomeCrianca, etapas, tituloId }) {
  const atual = etapas?.find((etapa) => etapa.situacao === 'atual');
  const texto = !etapas
    ? 'Carregando a trilha…'
    : atual ? `${nomeCrianca} está na etapa ${atual.nome}.` : `${nomeCrianca} completou a trilha!`;

  return (
    <section className="adventure-map" aria-labelledby={tituloId}>
      <div className="map-banner"><div><h2 id={tituloId}>Mapa da aventura</h2><p>{texto}</p></div><img src="/images/mascote.png" alt="" /></div>
      <ol className="trail" style={{ '--etapas': etapas?.length || 1 }}>
        {(etapas ?? []).map((etapa, indice) => {
          const classe = { concluida: 'finished', atual: 'current', bloqueada: 'locked' }[etapa.situacao];
          const marcador = etapa.situacao === 'atual' ? indice + 1 : '🚩';
          const legenda = etapa.situacao === 'bloqueada' ? 'a descobrir' : `${etapa.percentual}%`;
          return <li className={classe} key={etapa.etapa_id}><span>{marcador}</span><b>{etapa.nome}</b><small>{legenda}</small></li>;
        })}
      </ol>
    </section>
  );
}

function Home({ onNavigate }) {
  const crianca = obterCriancaSelecionada();
  const nomeCrianca = crianca?.nome || 'criança';
  const { resumo, erro, recarregar } = useResumoProgresso(obterCriancaId());
  const cards = [
    ['Jogar', 'ilustra-jogos.png', '', 'jogos'],
    ['Histórias', 'ilustra-historias.png', '', 'historias'],
    ['Atividades', 'ilustra-atividades.png', '', 'atividades'],
    ['Conquistas', 'ilustra-conquistas.png', '', 'progresso'],
    ['Jornada', 'ilustra-progresso.png', '', 'progresso'],
  ];
  return (
    <main className="app-shell">
      <AppHeader active="início" onNavigate={onNavigate} />
      <section className="home-content">
        <AvisoFaixaEtaria crianca={crianca} />
        <div className="journey-heading"><img src="/images/ilustra-progresso.png" alt="" /><div><span>Acompanhamento</span><h1>A jornada de {nomeCrianca}</h1></div></div>
        <IndicadoresProgresso resumo={resumo} erro={erro} recarregar={recarregar} />
        <MapaAventura nomeCrianca={nomeCrianca} etapas={resumo?.etapas} tituloId="map-title" />
        <section className="play-hero">
          <img src="/images/mascote.png" alt="" />
          <div><span>◖ Oi, {nomeCrianca}!</span><h2>Vamos brincar de ler?</h2><div className="syllables"><i>⛺</i><i>BA</i><i>BE</i><i>BI</i></div><button type="button" onClick={() => onNavigate('jogos')}>▶ <b>Começar</b></button></div>
        </section>
        <section className="shortcut-grid" aria-label="Atalhos do Clubinho">
          {cards.map(([title, image, badge, id]) => <button className="shortcut-card" type="button" onClick={() => onNavigate(id)} key={title}>{badge && <em>{badge}</em>}<img src={`/images/${image}`} alt="" /><strong>{title}</strong></button>)}
        </section>
      </section>
      <AppFooter />
    </main>
  );
}

const stories = [{
  id: 'baleia-bela',
  icon: '🐳',
  title: 'A Baleia e a Bola',
  nivel: 'Nível 1',
  nivelClasse: 'iniciante',
  objetivo: 'Reconhecer e acompanhar sílabas simples com BA, BE, BI e BO.',
  tag: 'BA · BE · BI · BO',
  time: '2 min',
  tema: 'oceano',
  texto: 'Bela é uma baleia azul. Ela nada no mar bem calmo. Bela vê uma bola boiando. A baleia bate na bola: ploc, ploc! Depois, Bela dá tchau para a bola e volta feliz para casa.',
}, {
  id: 'gato-guto',
  icon: '🐱',
  title: 'O Gato Guto',
  nivel: 'Nível 1',
  nivelClasse: 'iniciante',
  objetivo: 'Reconhecer e acompanhar sílabas simples com GA, GO e GU.',
  tag: 'GA · GO · GU',
  time: '2 min',
  tema: 'noite',
  texto: 'Guto é um gato. O gato viu uma gota de leite no prato. Guto lambeu a gota. Depois, o gato dormiu no tapete.',
}, {
  id: 'bia-borboleta',
  icon: '🦋',
  title: 'Bia e a Borboleta',
  nivel: 'Nível 2',
  nivelClasse: 'intermediario',
  objetivo: 'Ler frases curtas conectadas, observando a repetição de BI, BO e BR.',
  tag: 'BI · BO · BR',
  time: '2 min',
  tema: 'jardim',
  texto: 'Bia viu uma borboleta na flor. A borboleta bateu as asas e voou. Bia ficou bem feliz. Ela viu a borboleta pousar em uma folha.',
}, {
  id: 'casa-lia',
  icon: '🏠',
  title: 'A Casa de Lia',
  nivel: 'Nível 2',
  nivelClasse: 'intermediario',
  objetivo: 'Ler frases curtas com palavras do cotidiano e sílabas LA, SA e MA.',
  tag: 'LA · SA · MA',
  time: '2 min',
  tema: 'casa',
  texto: 'Lia mora em uma casa amarela. Na sala, ela viu uma mala e uma bola. Lia chamou sua avó para brincar.',
}, {
  id: 'piquenique-caio',
  icon: '🧺',
  title: 'Piquenique com Caio',
  nivel: 'Nível 3',
  nivelClasse: 'avancado',
  objetivo: 'Acompanhar uma narrativa curta com começo, acontecimento e final.',
  tag: 'CA · CO · PI',
  time: '3 min',
  tema: 'parque',
  texto: 'Caio levou uma cesta com bolo, banana e suco. No parque, ele viu uma borboleta perto das flores. Caio dividiu o lanche com Bia. Depois, os dois correram e brincaram na grama.',
}, {
  id: 'passeio-nino',
  icon: '🛴',
  title: 'O Passeio de Nino',
  nivel: 'Nível 3',
  nivelClasse: 'avancado',
  objetivo: 'Acompanhar uma narrativa curta com mais personagens e ações.',
  tag: 'NI · PA · CA',
  time: '3 min',
  tema: 'ceu',
  texto: 'Nino levou seu patinete para o parque. No caminho, ele encontrou uma amiga e seu cachorro. Os dois pararam perto de uma árvore para beber água. Depois, Nino voltou para casa muito contente.',
}];

const metodologiaHistorias = {
  iniciante: 'Palavras e frases curtas, com repetição de sílabas simples para apoiar a decodificação.',
  intermediario: 'Frases conectadas e vocabulário do cotidiano para desenvolver ritmo e fluência de leitura.',
  avancado: 'Histórias curtas com início, acontecimento e desfecho para apoiar a compreensão do texto.',
};

function separarPalavras(texto) {
  return [...texto.matchAll(/[A-Za-zÀ-ÖØ-öø-ÿ]+(?:-[A-Za-zÀ-ÖØ-öø-ÿ]+)*[.,!?;:]*/g)].map((resultado) => ({
    texto: resultado[0],
    inicio: resultado.index,
  }));
}

function IconeLeitor({ tipo }) {
  if (tipo === 'reiniciar') return <svg className="reader-icon-reiniciar" viewBox="0 0 24 24" aria-hidden="true"><path className="restart-arrowhead" d="M4 3v7h7Z" /><path d="M5.5 8A8 8 0 1 1 4 14" /></svg>;
  if (tipo === 'pausar') return <svg className="reader-icon-pausar" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>;
  return <svg className="reader-icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z" /></svg>;
}

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

  function palavraNoIndiceDeCaractere(indice) {
    let encontrada = 0;
    palavras.forEach((palavra, posicao) => {
      if (palavra.inicio <= indice) encontrada = posicao;
    });
    return encontrada;
  }

  function iniciarLeitura(indiceInicial = proximaPalavra.current) {
    if (!('speechSynthesis' in window)) {
      setMensagem('A narração não está disponível neste navegador.');
      return;
    }
    if (indiceInicial >= palavras.length) indiceInicial = 0;
    window.speechSynthesis.cancel();

    const inicio = palavras[indiceInicial].inicio;
    const fala = new SpeechSynthesisUtterance(historia.texto.slice(inicio));
    fala.lang = 'pt-BR';
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
    const fala = new SpeechSynthesisUtterance(palavras[indice].texto);
    fala.lang = 'pt-BR';
    fala.rate = 0.78;
    fala.onend = () => {
      setRepetindoPalavra(false);
      setMensagem('Leitura pausada. Toque em continuar para seguir a história.');
    };
    fala.onerror = () => setRepetindoPalavra(false);
    window.speechSynthesis.speak(fala);
  }

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

function InformacoesHistoria({ historia, onClose }) {
  return <div className="terms-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="terms-dialog story-info-dialog" role="dialog" aria-modal="true" aria-labelledby="story-info-title">
      <button className="terms-close" type="button" onClick={onClose} aria-label="Fechar informações da história">×</button>
      <span className={`story-level story-level-${historia.nivelClasse}`}>{historia.nivel}</span>
      <h1 id="story-info-title">Sobre esta história</h1>
      <p><strong>Foco:</strong> {historia.objetivo}</p>
      <p><strong>Como ela foi pensada:</strong> {metodologiaHistorias[historia.nivelClasse]}</p>
    </section>
  </div>;
}

function Stories({ onNavigate }) {
  const [historiaAberta, setHistoriaAberta] = useState(null);
  const [historiaInfo, setHistoriaInfo] = useState(null);
  if (historiaAberta) return <LivroHistoria historia={historiaAberta} onVoltar={() => setHistoriaAberta(null)} onNavigate={onNavigate} />;

  return <main className="app-shell"><AppHeader active="historias" onNavigate={onNavigate} />
    <section className="page-content stories-page">
      <section className="stories-intro"><img src="/images/ilustra-historias.png" alt="" /><div><span>Hora da história</span><h1>Vamos ler juntos?</h1><p>Escolha uma história e acompanhe a leitura palavra por palavra.</p></div></section>
      <h2 className="section-title">Escolha uma história</h2>
      <div className="story-grid">{stories.map((historia) => <article className={`story-card story-card-${historia.tema}`} key={historia.id}><button className="story-card-open" type="button" onClick={() => setHistoriaAberta(historia)} aria-label={`Abrir a história ${historia.title}`}><span className={`story-level story-level-${historia.nivelClasse}`}>{historia.nivel}</span><i>{historia.icon}</i><strong>{historia.title}</strong><small>{historia.tag}</small><em>{historia.time}</em></button><button className="story-info-button" type="button" onClick={() => setHistoriaInfo(historia)} aria-label={`Informações sobre ${historia.title}`} title="Sobre esta história">i</button></article>)}</div>
      <p className="parent-note">A história foi criada para o Clubinho ABC. Novas leituras serão adicionadas gradualmente.</p>
    </section>
    {historiaInfo && <InformacoesHistoria historia={historiaInfo} onClose={() => setHistoriaInfo(null)} />}
    <AppFooter />
  </main>;
}

const activities = [['▤', 'Caligrafia das vogais', 'Ficha para imprimir · 8 páginas', 'orange', 'Para imprimir'], ['✂', 'Recorte e cole: sílabas', 'Atividade manual · 6 páginas', 'blue', 'Recortar'], ['🎨', 'Pinte a letra inicial', 'Colorir · 12 páginas', 'yellow', 'Colorir'], ['▤', 'Cruzadinha de animais', 'Ficha para imprimir · 4 páginas', 'blue', 'Para imprimir'], ['✂', 'Alfabeto móvel', 'Atividade manual · 3 páginas', 'orange', 'Recortar']];
const EM_BREVE = 'Download disponível em breve';
function Activities({ onNavigate }) {
  const [filter, setFilter] = useState('Todas');
  const nomeCrianca = obterCriancaSelecionada()?.nome || 'criança';
  const visiveis = activities.filter(([, , , , categoria]) => filter === 'Todas' || categoria === filter);
  return <main className="app-shell"><AppHeader active="atividades" onNavigate={onNavigate} />
    <section className="page-content activities-page"><span className="eyebrow">Para fazer junto</span><h1>Atividades e materiais</h1><p className="page-intro">Selecionadas por professoras alfabetizadoras. Os materiais para baixar e imprimir estão em produção.</p>
      <section className="activity-feature"><div><span>Kit da semana</span><h2>Caderno BA-BE-BI completo</h2><p>22 páginas com traçado, colagem e leitura em voz alta, no ritmo da trilha de {nomeCrianca}.</p><button disabled title={EM_BREVE}>⇩ &nbsp; Em breve</button></div><b>✏️</b></section>
      <div className="filter-row">{['Todas', 'Para imprimir', 'Colorir', 'Recortar'].map(item => <button className={filter === item ? 'selected' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)} type="button" key={item}>{item}</button>)}</div>
      <div className="activity-grid">{visiveis.map(([icon, title, desc, tone]) => <article className="activity-card" key={title}><span className={`activity-icon ${tone}`}>{icon}</span><h2>{title}</h2><p>{desc}</p><button disabled title={EM_BREVE}>⇩ &nbsp; Em breve</button></article>)}</div>
    </section>
    <AppFooter />
  </main>;
}

function Progress({ onNavigate }) {
  const crianca = obterCriancaSelecionada();
  const nomeCrianca = crianca?.nome || 'criança';
  const { resumo, erro, recarregar } = useResumoProgresso(obterCriancaId());
  return <main className="app-shell"><AppHeader active="progresso" onNavigate={onNavigate} />
    <section className="page-content progress-page"><AvisoFaixaEtaria crianca={crianca} /><div className="journey-heading"><img src="/images/ilustra-progresso.png" alt="" /><div><span>Acompanhamento</span><h1>A jornada de {nomeCrianca}</h1></div></div>
      <IndicadoresProgresso resumo={resumo} erro={erro} recarregar={recarregar} />
      <MapaAventura nomeCrianca={nomeCrianca} etapas={resumo?.etapas} tituloId="progress-map-title" />
      <div className="progress-bottom"><section className="mastery"><h2>Progresso de {nomeCrianca} em cada etapa</h2>{(resumo?.etapas ?? []).map((etapa) => <div className="mastery-row" key={etapa.etapa_id}><strong>{etapa.nome}</strong><em>{etapa.situacao === 'bloqueada' ? 'a descobrir' : `${etapa.percentual}%`}</em><span><i style={{ width: `${etapa.percentual}%` }} /></span></div>)}</section><Conquistas conquistas={resumo?.conquistas} /></div>
    </section>
    <AppFooter />
  </main>;
}

const VIEWS_PROTEGIDAS = ['home', 'jogos', 'historias', 'atividades', 'progresso', 'confirmar-responsavel', 'conta'];
const VIEWS_PRE_LOGIN = ['login', 'signup', 'confirmar-email'];

function App() {
  const [view, setView] = useState('login');
  const [authTick, setAuthTick] = useState(0);
  const [emailCadastrado, setEmailCadastrado] = useState('');

  useEffect(() => aoMudarSessao(() => setAuthTick((valor) => valor + 1)), []);

  // Cobre dois casos: sessão já existia (F5) e clique no link do e-mail
  // (o Supabase autentica sozinho e cai aqui com a conta já confirmada).
  useEffect(() => {
    if (estaAutenticado() && perfilCompleto() && VIEWS_PRE_LOGIN.includes(view)) {
      setView('home');
    }
  }, [authTick, view]);

  const navigate = (page) => {
    const destino = page === 'início' || page === 'inicio' ? 'home' : page;
    setView(destino === 'conta' ? 'confirmar-responsavel' : destino);
  };

  if (precisaRedefinirSenha()) return <RedefinirSenha />;

  if (VIEWS_PROTEGIDAS.includes(view)) {
    if (!estaAutenticado()) return <Login onCreateAccount={() => setView('signup')} onLogin={() => setView('home')} />;
    if (!perfilCompleto()) {
      return (
        <main className="page-shell" id="inicio">
          <p className="form-message" role="status">Carregando sua conta… Se demorar, verifique se o servidor está no ar e entre de novo.</p>
          <button className="text-link" type="button" onClick={async () => { await sair(); setView('login'); }}>Voltar para o login</button>
        </main>
      );
    }
  }

  if (view === 'signup') {
    return (
      <Signup
        onBackToLogin={() => setView('login')}
        onFinish={(email) => {
          setEmailCadastrado(email);
          setView('confirmar-email');
        }}
      />
    );
  }
  if (view === 'confirmar-email') return <ConfirmeSeuEmail email={emailCadastrado} onVoltar={() => setView('login')} />;
  if (view === 'home') return <Home onNavigate={navigate} />;
  if (view === 'jogos') return <AreaDeJogos key={obterCriancaId()} Cabecalho={AppHeader} Rodape={AppFooter} onNavigate={navigate} />;
  if (view === 'historias') return <Stories onNavigate={navigate} />;
  if (view === 'atividades') return <Activities onNavigate={navigate} />;
  if (view === 'progresso') return <Progress onNavigate={navigate} />;
  if (view === 'confirmar-responsavel') return <ConfirmarResponsavel onBack={() => setView('home')} onConfirmed={() => setView('conta')} />;
  if (view === 'conta') return <MinhaConta onNavigate={navigate} />;
  return <Login onCreateAccount={() => setView('signup')} onLogin={() => setView('home')} />;
}

export default App;
