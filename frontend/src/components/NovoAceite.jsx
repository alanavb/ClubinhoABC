import { useState } from 'react';
import TermosDeUso from '../TermosDeUso';
import PoliticaDePrivacidade from '../PoliticaDePrivacidade';
import { aceitarDocumentos } from '../utils/auth';

const NOMES = { termos: 'Termos de Uso', privacidade: 'Política de Privacidade' };

// Janela que bloqueia o uso até o responsável aceitar as versões novas dos documentos
export default function NovoAceite({ pendentes, onSair }) {
  const [confirmado, setConfirmado] = useState(false);
  const [aberto, setAberto] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function aceitar() {
    setEnviando(true);
    setErro('');
    try {
      await aceitarDocumentos(pendentes.map((documento) => documento.id));
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  }

  return (
    <div className="terms-overlay" role="presentation">
      <section className="terms-dialog novo-aceite" role="dialog" aria-modal="true" aria-labelledby="novo-aceite-titulo">
        <h1 id="novo-aceite-titulo">Atualizamos nossos documentos</h1>
        <p>Para continuar usando o Clubinho ABC, leia e aceite as novas versões:</p>
        <ul className="novo-aceite-lista">
          {pendentes.map((documento) => (
            <li key={documento.id}>
              <button type="button" onClick={() => setAberto(documento.tipo)}>{NOMES[documento.tipo]}</button>
              <small>versão {documento.versao}</small>
            </li>
          ))}
        </ul>
        <div className="terms-acceptance">
          <input id="novo-aceite-confirmacao" type="checkbox" checked={confirmado} onChange={(evento) => setConfirmado(evento.target.checked)} />
          <label htmlFor="novo-aceite-confirmacao">Li e aceito as novas versões</label>
        </div>
        {erro && <p className="form-message" role="alert">{erro}</p>}
        <div className="novo-aceite-acoes">
          <button className="text-link" type="button" onClick={onSair}>Sair</button>
          <button className="account-action-button" type="button" disabled={!confirmado || enviando} onClick={aceitar}>
            {enviando ? 'Registrando…' : 'Aceitar e continuar'}
          </button>
        </div>
      </section>
      {aberto === 'termos' && <TermosDeUso onClose={() => setAberto(null)} />}
      {aberto === 'privacidade' && <PoliticaDePrivacidade onClose={() => setAberto(null)} />}
    </div>
  );
}
