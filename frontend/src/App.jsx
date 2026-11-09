import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AreaDeJogos from './jogos/AreaDeJogos';
import TermosDeUso from './TermosDeUso';
import PoliticaDePrivacidade from './PoliticaDePrivacidade';
import DashboardProgresso from './DashboardProgresso';
import HomePage from './pages/HomePage';
import AtividadesPage from './pages/AtividadesPage';
import ProgressoPage from './pages/ProgressoPage';
import HistoriasPage from './pages/HistoriasPage';
import { Brand, CampoSenha, ConfirmeSeuEmail, Login, RedefinirSenha, Signup } from './components/auth/AuthViews';
import {
  adicionarCrianca,
  aoMudarSessao,
  atualizarSenha,
  cadastrar,
  confirmarSenhaResponsavel,
  editarCrianca,
  excluirConta,
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
import { CATEGORIAS, REFERENCIA, kitDaSemana, materiais } from './utils/materiais';

const pets = ['🦊', '🐨', '🐥', '🦕', '🐙', '🐝'];
const hojeLocal = () => new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD no fuso do navegador
const REQUISITOS_SENHA = 'Mínimo de 8 caracteres, com pelo menos uma letra maiúscula, uma minúscula, um número e um símbolo.';
const ERRO_SENHA = 'Sua senha ainda não atende aos requisitos.';

function AvisoDoSistema({ onEntrarNovamente }) {
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    const receberAviso = (evento) => setAviso(evento.detail);
    window.addEventListener('clubinho:aviso', receberAviso);
    return () => window.removeEventListener('clubinho:aviso', receberAviso);
  }, []);

  if (!aviso) return null;

  const entrarNovamente = async () => {
    await sair();
    setAviso(null);
    onEntrarNovamente();
  };

  return createPortal(
    <section className="system-notice" role="status" aria-live="polite" aria-atomic="true">
      <p>{aviso.mensagem}</p>
      {aviso.acao === 'entrar' ? (
        <button type="button" onClick={entrarNovamente}>Entrar novamente</button>
      ) : (
        <button type="button" onClick={() => setAviso(null)}>Entendi</button>
      )}
    </section>,
    document.body,
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

function MinhaConta({ onNavigate, onAccountDeleted }) {
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
                <p>A exclusão da conta remove definitivamente o acesso do responsável, os perfis, o histórico e o progresso das crianças vinculadas.</p>
                <p>Para proteger a família, a área da conta exige a senha do responsável e uma confirmação expressa antes da exclusão.</p>
                <button type="button" onClick={() => setShowDeleteConfirm(true)}>Solicitar exclusão da conta</button>
              </div>
            </section>}
          </div>
        </div>
      </section>
      {criancaEmEdicao && <EditarCriancaDialog crianca={criancaEmEdicao} onClose={() => setCriancaEmEdicao(null)} />}
      {criancaParaExcluir && <ConfirmarExclusaoCrianca crianca={criancaParaExcluir} onClose={() => setCriancaParaExcluir(null)} />}
      {showDeleteConfirm && <ConfirmarExclusaoConta onClose={() => setShowDeleteConfirm(false)} onDeleted={onAccountDeleted} />}
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

function ConfirmarExclusaoConta({ onClose, onDeleted }) {
  const fraseConfirmacao = 'EXCLUIR MINHA CONTA';
  const [confirmacao, setConfirmacao] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const [erro, setErro] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const confirmacaoCorreta = confirmacao.trim().replace(/\s+/g, ' ') === fraseConfirmacao;

  async function excluirDefinitivamente() {
    if (!confirmacaoCorreta || !confirmado || excluindo) return;
    setErro('');
    setExcluindo(true);
    try {
      await excluirConta(confirmacao);
      onClose();
      onDeleted();
    } catch (falha) {
      setErro(falha.message);
      setExcluindo(false);
    }
  }

  return (
    <div className="terms-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="terms-dialog delete-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
        <button className="terms-close" type="button" onClick={onClose} aria-label="Fechar confirmação de exclusão">×</button>
        <span className="delete-confirm-icon" aria-hidden="true">⚠️</span>
        <h1 id="delete-confirm-title">Excluir conta definitivamente</h1>
        <p>A conta e os dados vinculados serão excluídos assim que você confirmar. Esta ação não pode ser desfeita.</p>
        <ul>
          <li>O acesso do responsável será encerrado.</li>
          <li>Os perfis, resultados e progresso das crianças vinculadas serão removidos.</li>
          <li>Essa ação é irreversível depois da confirmação.</li>
        </ul>
        <label className="delete-confirm-phrase" htmlFor="delete-account-confirmation">Para continuar, escreva <strong>{fraseConfirmacao}</strong>.</label>
        <input
          id="delete-account-confirmation"
          value={confirmacao}
          onChange={(event) => setConfirmacao(event.target.value)}
          placeholder={fraseConfirmacao}
          autoComplete="off"
        />
        <label className="delete-confirm-check"><input type="checkbox" checked={confirmado} onChange={(event) => setConfirmado(event.target.checked)} /> Entendo as consequências e quero excluir a conta.</label>
        {erro && <p className="form-message" role="alert">{erro}</p>}
        <div className="delete-confirm-actions">
          <button className="back-button" type="button" onClick={onClose} disabled={excluindo}>Cancelar</button>
          <button className="delete-confirm-button" type="button" onClick={excluirDefinitivamente} disabled={!confirmacaoCorreta || !confirmado || excluindo}>{excluindo ? 'Excluindo…' : 'Excluir definitivamente'}</button>
        </div>
      </section>
    </div>
  );
}

function ExclusaoContaConcluida({ onClose }) {
  return (
    <div className="terms-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="terms-dialog delete-success-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-success-title">
        <span className="delete-success-icon" aria-hidden="true">✓</span>
        <h1 id="delete-success-title">Conta excluída com sucesso</h1>
        <p>A conta do responsável e os dados vinculados foram removidos do Clubinho ABC.</p>
        <button className="account-action-button" type="button" onClick={onClose}>Entendi</button>
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

const VIEWS_PROTEGIDAS = ['home', 'jogos', 'historias', 'atividades', 'progresso', 'confirmar-responsavel', 'conta'];
const VIEWS_PRE_LOGIN = ['login', 'signup', 'confirmar-email'];

function App() {
  const [view, setView] = useState('login');
  const [authTick, setAuthTick] = useState(0);
  const [emailCadastrado, setEmailCadastrado] = useState('');
  const [exclusaoConcluida, setExclusaoConcluida] = useState(false);

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

  let conteudo;

  if (precisaRedefinirSenha()) {
    conteudo = <RedefinirSenha />;
  } else if (VIEWS_PROTEGIDAS.includes(view) && !estaAutenticado()) {
    conteudo = <Login onCreateAccount={() => setView('signup')} onLogin={() => setView('home')} />;
  } else if (VIEWS_PROTEGIDAS.includes(view) && !perfilCompleto()) {
    conteudo = (
      <main className="page-shell" id="inicio">
        <p className="form-message" role="status">Carregando sua conta… Se demorar, verifique se o servidor está no ar e entre de novo.</p>
        <button className="text-link" type="button" onClick={async () => { await sair(); setView('login'); }}>Voltar para o login</button>
      </main>
    );
  } else if (view === 'signup') {
    conteudo = (
      <Signup
        onBackToLogin={() => setView('login')}
        onFinish={(email) => {
          setEmailCadastrado(email);
          setView('confirmar-email');
        }}
      />
    );
  } else if (view === 'confirmar-email') {
    conteudo = <ConfirmeSeuEmail email={emailCadastrado} onVoltar={() => setView('login')} />;
  } else if (view === 'home') {
    conteudo = <HomePage onNavigate={navigate} />;
  } else if (view === 'jogos') {
    conteudo = <AreaDeJogos key={obterCriancaId()} Cabecalho={AppHeader} Rodape={AppFooter} onNavigate={navigate} />;
  } else if (view === 'historias') {
    conteudo = <HistoriasPage onNavigate={navigate} />;
  } else if (view === 'atividades') {
    conteudo = <AtividadesPage onNavigate={navigate} />;
  } else if (view === 'progresso') {
    conteudo = <ProgressoPage onNavigate={navigate} />;
  } else if (view === 'confirmar-responsavel') {
    conteudo = <ConfirmarResponsavel onBack={() => setView('home')} onConfirmed={() => setView('conta')} />;
  } else if (view === 'conta') {
    conteudo = <MinhaConta onNavigate={navigate} onAccountDeleted={() => {
      setView('login');
      setExclusaoConcluida(true);
    }} />;
  } else {
    conteudo = <Login onCreateAccount={() => setView('signup')} onLogin={() => setView('home')} />;
  }

  return <><AvisoDoSistema onEntrarNovamente={() => setView('login')} />{conteudo}{exclusaoConcluida && <ExclusaoContaConcluida onClose={() => setExclusaoConcluida(false)} />}</>;
}

export default App;
