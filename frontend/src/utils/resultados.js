// RN2 — Registro do resultado da atividade
// Ao finalizar uma tentativa, registra se a resposta da criança foi correta ou
// incorreta, associando o resultado à atividade e à criança.

const CHILD_ID_MOCK = 1; // usamos um id fixo

const resultados = [];

export function registrarResultado(activityId, resposta, correta) {
  const resultado = {
    child_id: CHILD_ID_MOCK,
    activity_id: activityId,
    answer: resposta,
    correct: correta,
  };
  resultados.push(resultado);
  return resultado;
}

export function listarResultados() {
  return [...resultados];
}
