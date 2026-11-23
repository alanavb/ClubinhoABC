import DocumentoLegal from './components/DocumentoLegal';

// Janela com a versão vigente da política de privacidade (texto guardado no banco)
function PoliticaDePrivacidade({ onClose }) {
  return <DocumentoLegal tipo="privacidade" titulo="Política de Privacidade - Clubinho ABC" rotuloFechar="Fechar política de privacidade" onClose={onClose} />;
}

export default PoliticaDePrivacidade;
