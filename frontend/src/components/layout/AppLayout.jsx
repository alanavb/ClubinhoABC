import { useEffect, useState } from 'react';
import TermosDeUso from '../../TermosDeUso';
import PoliticaDePrivacidade from '../../PoliticaDePrivacidade';
import { obterCriancaId, obterCriancaSelecionada, sair } from '../../utils/auth';
import { useResumoProgresso } from '../../utils/etapas';

const navItems = [
  ['início', '⛱️', 'Início'],
  ['jogos', '🎮', 'Jogos'],
  ['historias', '📚', 'Histórias'],
  ['atividades', '🖍️', 'Atividades'],
  ['progresso', '🛝', 'Progresso'],
];

export function Brand() {
  return <a className="brand" href="#inicio" aria-label="Clubinho ABC"><span className="brand-mark"><img src="/images/mascote.png" alt="" /></span><span>CLUBINHO <strong>ABC</strong></span></a>;
}

export function AppHeader({ active, onNavigate }) {
  const crianca = obterCriancaSelecionada();
  const nomeCrianca = crianca?.nome || 'Manu';
  const estrelas = useResumoProgresso(obterCriancaId()).resumo?.estrelas ?? 0;
  async function sairDaConta() { await sair(); onNavigate('login'); }
  return <header className="app-header"><Brand /><nav className="app-nav" aria-label="Navegação principal">{navItems.map(([id, icon, label]) => <button className={active === id ? 'active' : ''} type="button" key={id} onClick={() => onNavigate(id)}><span aria-hidden="true">{icon}</span>{label}</button>)}</nav><div className="profile-summary"><span className="stars">⭐ <b>{estrelas} estrelas</b></span><button className="child-profile" type="button" onClick={() => onNavigate('conta')} aria-label="Abrir minha conta"><span className="child-avatar" aria-hidden="true">{crianca?.avatar || '🙂'}</span>{nomeCrianca}</button><button className="text-link" type="button" onClick={sairDaConta}>Sair</button></div></header>;
}

function ContactDialog({ onClose }) {
  useEffect(() => { const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [onClose]);
  return <div className="terms-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="terms-dialog contact-dialog" role="dialog" aria-modal="true" aria-labelledby="contact-title"><button className="terms-close" type="button" onClick={onClose} aria-label="Fechar contato">×</button><span className="contact-dialog-icon" aria-hidden="true">💌</span><h1 id="contact-title">Fale com a gente</h1><p>Precisa de ajuda, quer enviar uma sugestão ou encontrou alguma dificuldade? A equipe do Clubinho ABC está à disposição para ouvir você.</p><p>Envie sua mensagem para:</p><a className="contact-dialog-email" href="mailto:clubinhoabc@gmail.com?subject=Contato%20pelo%20Clubinho%20ABC">clubinhoabc@gmail.com</a><p className="contact-dialog-note">Para proteger sua conta, não envie senhas, códigos de confirmação ou outras credenciais por e-mail.</p></section></div>;
}

export function AppFooter() {
  const [showTerms, setShowTerms] = useState(false); const [showPrivacy, setShowPrivacy] = useState(false); const [showContact, setShowContact] = useState(false);
  return <footer className="app-footer"><span>Clubinho ABC</span><div><button type="button" onClick={() => setShowTerms(true)}>Termos de Uso</button><button type="button" onClick={() => setShowPrivacy(true)}>Política de Privacidade</button><button type="button" onClick={() => setShowContact(true)}>Contato</button></div>{showTerms && <TermosDeUso onClose={() => setShowTerms(false)} />}{showPrivacy && <PoliticaDePrivacidade onClose={() => setShowPrivacy(false)} />}{showContact && <ContactDialog onClose={() => setShowContact(false)} />}</footer>;
}
