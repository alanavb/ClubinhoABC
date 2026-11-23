import DocumentoLegal from './components/DocumentoLegal';

// Janela com a versão vigente dos termos de uso (texto guardado no banco)
function TermosDeUso({ onClose }) {
  return <DocumentoLegal tipo="termos" titulo="Termos e Condições de Uso - Clubinho ABC" rotuloFechar="Fechar termos de uso" onClose={onClose} />;
}

export default TermosDeUso;
