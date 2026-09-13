// RN2 — Registro do resultado da atividade
// Envia cada tentativa da criança para o back-end (Flask), que verifica se a
// resposta enviada bate com a esperada e persiste o resultado associado à
// criança e à atividade.

export const API_BASE_URL = 'http://localhost:5000/api';

export const CHILD_ID_MOCK = 1; // enquanto não há autenticação real, usamos a criança de teste do backend/seeds.py

// IDs criados por backend/seeds.py, na mesma ordem das atividades do front (CacaAsLetras.jsx)
const ATIVIDADE_IDS = { ouvir: 1, palavra: 2, memoria: 3 };

export async function registrarResultado(activityKey, respostaEnviada, respostaEsperada) {
  try {
    const resposta = await fetch(`${API_BASE_URL}/resultados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crianca_id: CHILD_ID_MOCK,
        atividade_id: ATIVIDADE_IDS[activityKey],
        resposta_enviada: respostaEnviada,
        resposta_esperada: respostaEsperada,
      }),
    });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    return await resposta.json();
  } catch (erro) {
    console.error('RN2: não foi possível registrar o resultado no back-end.', erro);
    return null;
  }
}

export async function listarResultados() {
  const resposta = await fetch(`${API_BASE_URL}/resultados?crianca_id=${CHILD_ID_MOCK}`);
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}
