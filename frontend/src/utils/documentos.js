// Termos de Uso e Política de Privacidade vigentes, lidos do back-end

import { API_BASE_URL } from './api';

let carregamento = null; // os textos mudam pouco: uma busca por visita basta

// Versões vigentes dos dois documentos (rota pública, usada também no cadastro)
export function buscarDocumentosVigentes() {
  if (!carregamento) {
    carregamento = fetch(`${API_BASE_URL}/documentos`)
      .then((resposta) => {
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
        return resposta.json(); // [{ id, tipo, versao, vigente_desde, conteudo }]
      })
      .catch((erro) => {
        carregamento = null; // permite tentar de novo
        throw erro;
      });
  }
  return carregamento;
}

// Data do banco (AAAA-MM-DD) no formato brasileiro
export function formatarData(data) {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}
