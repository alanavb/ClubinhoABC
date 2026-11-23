import { useEffect, useState } from 'react';
import { buscarDocumentosVigentes, formatarData } from '../utils/documentos';

// Trecho com **negrito** sem usar HTML vindo do banco
function TextoComNegrito({ texto }) {
  return texto.split('**').map((parte, indice) => (indice % 2 ? <strong key={indice}>{parte}</strong> : parte));
}

// Conversão do texto guardado no banco: "## " é título, "- " é item de lista, o resto é parágrafo
export function TextoDoDocumento({ conteudo }) {
  const blocos = conteudo.split(/\n\s*\n/).map((bloco) => bloco.trim()).filter(Boolean);
  return blocos.map((bloco, indice) => {
    if (bloco.startsWith('## ')) return <h2 key={indice}>{bloco.slice(3)}</h2>;
    const linhas = bloco.split('\n');
    if (linhas.every((linha) => linha.startsWith('- '))) {
      return <ul key={indice}>{linhas.map((linha, i) => <li key={i}><TextoComNegrito texto={linha.slice(2)} /></li>)}</ul>;
    }
    return <p key={indice}><TextoComNegrito texto={bloco} /></p>;
  });
}

// Janela com a versão vigente de um documento ('termos' ou 'privacidade')
export default function DocumentoLegal({ tipo, titulo, rotuloFechar, onClose }) {
  const [documento, setDocumento] = useState(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativa = true;
    buscarDocumentosVigentes()
      .then((documentos) => { if (ativa) setDocumento(documentos.find((item) => item.tipo === tipo) ?? null); })
      .catch(() => { if (ativa) setErro(true); });
    return () => { ativa = false; };
  }, [tipo]);

  // Fechamento da janela pela tecla Escape
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  let corpo;
  if (erro) {
    corpo = <p role="alert">Não foi possível carregar o documento agora. Feche a janela e tente novamente em instantes.</p>;
  } else if (!documento) {
    corpo = <p role="status">Carregando…</p>;
  } else {
    corpo = <>
      <p><strong>Versão {documento.versao} - vigente desde {formatarData(documento.vigente_desde)}</strong></p>
      <TextoDoDocumento conteudo={documento.conteudo} />
    </>;
  }

  return (
    <div className="terms-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="terms-dialog" role="dialog" aria-modal="true" aria-labelledby={`${tipo}-titulo`}>
        <button className="terms-close" type="button" onClick={onClose} aria-label={rotuloFechar}>×</button>
        <h1 id={`${tipo}-titulo`}>{titulo}</h1>
        {corpo}
      </section>
    </div>
  );
}
