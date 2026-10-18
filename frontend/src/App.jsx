import { useEffect, useState } from 'react';
import AreaDeJogos from './jogos/AreaDeJogos';
import { falar } from './jogos/alfabeto';
import TermosDeUso from './TermosDeUso';
import PoliticaDePrivacidade from './PoliticaDePrivacidade';
import {
  adicionarCrianca,
  aoMudarSessao,
  atualizarSenha,
  cadastrar,
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
    setStep((current) => Math.min(3, current + 1));
  }

  async function finalizarCadastro() {
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
              <input id="guardian-password" type="password" placeholder="mínimo 8 caracteres" value={guardianPassword} onChange={(event) => setGuardianPassword(event.target.value)} minLength={8} required />
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
              <div className="trail-tags"><span>✣ Letras do nome</span><span>✣ Sílabas mágicas</span><span>✣ Primeiras palavras</span></div>
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
      <section className="content-grid">
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
      <section className="content-grid">
        <section className="login-card" aria-labelledby="reset-title">
          <img src="/images/mascote.png" alt="" className="login-mascot" />
          <h1 id="reset-title">Crie uma <em>nova senha</em></h1>
          <form onSubmit={salvar}>
            <label htmlFor="new-password">Nova senha</label>
            <input id="new-password" type="password" placeholder="mínimo 8 caracteres" value={senha} onChange={(event) => setSenha(event.target.value)} minLength={8} required />
            <label htmlFor="new-password-confirm">Confirme a nova senha</label>
            <input id="new-password-confirm" type="password" placeholder="digite de novo" value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} minLength={8} required />
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

function AvisoFaixaEtaria({ crianca }) {
  if (!crianca?.fora_da_faixa_etaria) return null;
  return (
    <p className="age-warning" role="status">
      <strong>Para o responsável:</strong> {crianca.nome} tem {textoIdade(crianca)}, e o Clubinho ABC é indicado para crianças de 6 a 7 anos.
      Avalie se as atividades ainda fazem sentido para ela. Você pode continuar usando normalmente.
    </p>
  );
}

function FamiliaDialog({ onClose }) {
  const criancas = obterPerfil()?.criancas ?? [];
  const selecionadaId = obterCriancaId();
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [pet, setPet] = useState(pets[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fecharComEsc = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fecharComEsc);
    return () => window.removeEventListener('keydown', fecharComEsc);
  }, [onClose]);

  async function salvar(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await adicionarCrianca({ nome, dataNascimento, avatar: pet });
      onClose();
    } catch (erro) {
      setMessage(erro.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="terms-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="terms-dialog family-dialog" role="dialog" aria-modal="true" aria-labelledby="family-title">
        <button className="terms-close" type="button" onClick={onClose} aria-label="Fechar">×</button>
        <h1 id="family-title">Crianças da família</h1>
        <p>Escolha quem vai brincar agora.</p>
        <ul className="family-list">
          {criancas.map((crianca) => (
            <li key={crianca.crianca_id}>
              <button
                type="button"
                className={crianca.crianca_id === selecionadaId ? 'selected' : ''}
                aria-pressed={crianca.crianca_id === selecionadaId}
                onClick={() => { selecionarCrianca(crianca.crianca_id); onClose(); }}
              >
                <span className="family-pet" aria-hidden="true">{crianca.avatar || '🙂'}</span>
                <strong>{crianca.nome}</strong>
                <small>{textoIdade(crianca)}{crianca.fora_da_faixa_etaria ? ' · fora da faixa de 6 a 7 anos' : ''}</small>
              </button>
            </li>
          ))}
        </ul>
        <h2>Adicionar criança</h2>
        <form onSubmit={salvar}>
          <CamposCrianca idPrefixo="new-child" nome={nome} setNome={setNome} dataNascimento={dataNascimento} setDataNascimento={setDataNascimento} pet={pet} setPet={setPet} />
          {message && <p className="form-message" role="alert">{message}</p>}
          <button className="small-primary" type="submit" disabled={submitting}>{submitting ? 'Salvando…' : 'Adicionar criança'}</button>
        </form>
      </section>
    </div>
  );
}

function AppHeader({ active, onNavigate }) {
  const crianca = obterCriancaSelecionada();
  const nomeCrianca = crianca?.nome || 'Manu';
  const estrelas = useEstrelas(obterCriancaId());
  const [showFamilia, setShowFamilia] = useState(false);

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
        <button className="child-profile" type="button" onClick={() => setShowFamilia(true)} aria-label={`${nomeCrianca}: trocar ou adicionar criança`}>
          <span className="child-avatar" aria-hidden="true">{crianca?.avatar || '🙂'}</span>{nomeCrianca}
        </button>
        <button className="text-link" type="button" onClick={sairDaConta}>Sair</button>
      </div>
      {showFamilia && <FamiliaDialog onClose={() => setShowFamilia(false)} />}
    </header>
  );
}

function AppFooter() {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <footer className="app-footer">
      <span>Clubinho ABC</span>
      <div>
        <button type="button" onClick={() => setShowTerms(true)}>Termos de Uso</button>
        <button type="button" onClick={() => setShowPrivacy(true)}>Política de Privacidade</button>
      </div>
      {showTerms && <TermosDeUso onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PoliticaDePrivacidade onClose={() => setShowPrivacy(false)} />}
    </footer>
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
          const marcador = { concluida: '✓', atual: indice + 1, bloqueada: '♧' }[etapa.situacao];
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

const stories = [
  ['🐳', 'A Baleia Bela', 'BA · BE', '4 min', 'A baleia Bela nada bem devagar e brinca com as bolhas do mar.'],
  ['🦥', 'Bia e o Bicho-preguiça', 'BI', '5 min', 'Bia encontra um bicho-preguiça que só quer dormir na árvore.'],
  ['🎪', 'O Circo do Bê', 'BÊ · BA', '6 min', 'O palhaço Bê monta um circo cheio de bolas e balões.'],
  ['🍇', 'A Uva que Voou', 'Vogais', '4 min', 'Uma uva pula do cacho e voa até o céu azul.'],
  ['🌼', 'Dente de Leão', 'DE · DI', '7 min', 'Um dente-de-leão espalha suas sementes com o vento.'],
  ['🌙', 'O Soninho da Lua', 'Ninar', '8 min', 'A lua dá boa-noite para todos os bichinhos da floresta.'],
];
function Stories({ onNavigate }) {
  const [selecionada, setSelecionada] = useState(stories.length - 1);
  const [icon, title, , time, resumo] = stories[selecionada];
  const ouvir = (indice) => { const [, titulo, , , texto] = stories[indice]; falar(`${titulo}. ${texto}`); };
  return <main className="app-shell"><AppHeader active="historias" onNavigate={onNavigate} />
    <section className="page-content stories-page"><section className="story-hero"><div><span>◔ Hora da história</span><h1>{title}</h1><p>{resumo}</p><div className="story-tags"><i>{icon}</i></div><button className="round-play" type="button" onClick={() => ouvir(selecionada)}>▶ <b>Ouvir</b></button><small>♧ &nbsp; {time}</small></div><img src="/images/ilustra-historias.png" alt="Ilustração da história" /></section>
      <h2 className="section-title">✣ Escolha uma história</h2><div className="story-grid">{stories.map(([cardIcon, cardTitle, tag, cardTime], indice) => <button type="button" className={`story-card ${indice === selecionada ? 'selected' : ''}`} aria-pressed={indice === selecionada} key={cardTitle} onClick={() => { setSelecionada(indice); ouvir(indice); }}><span>{tag}</span><i>{cardIcon}</i><strong>{cardTitle}</strong><small>♧ {cardTime}</small></button>)}</div><p className="parent-note">Para os responsáveis: toque em uma história para ouvir a narração. As histórias completas ainda estão em produção.</p>
    </section>
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

const VIEWS_PROTEGIDAS = ['home', 'jogos', 'historias', 'atividades', 'progresso'];
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

  const navigate = (page) => setView(page === 'início' || page === 'inicio' ? 'home' : page);

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
  return <Login onCreateAccount={() => setView('signup')} onLogin={() => setView('home')} />;
}

export default App;
