export const palavrasDoAlfabeto = [
  ['A', 'Abelha', '🐝'], ['B', 'Bola', '⚽'], ['C', 'Casa', '🏠'], ['D', 'Dado', '🎲'],
  ['E', 'Elefante', '🐘'], ['F', 'Foca', '🦭'], ['G', 'Gato', '🐱'], ['H', 'Hipopótamo', '🦛'],
  ['I', 'Igreja', '⛪'], ['J', 'Jacaré', '🐊'], ['K', 'Kiwi', '🥝'], ['L', 'Lua', '🌙'],
  ['M', 'Macaco', '🐒'], ['N', 'Navio', '🚢'], ['O', 'Ovo', '🥚'], ['P', 'Pato', '🦆'],
  ['Q', 'Queijo', '🧀'], ['R', 'Rato', '🐭'], ['S', 'Sol', '☀️'], ['T', 'Tatu', '🦔'],
  ['U', 'Uva', '🍇'], ['V', 'Vaca', '🐮'], ['W', 'Waffle', '🧇'], ['X', 'Xícara', '☕'],
  ['Y', 'Yak', '🐂'], ['Z', 'Zebra', '🦓'],
].map(([letra, palavra, icone]) => ({ letra, palavra, icone }));

export const letras = palavrasDoAlfabeto.map(({ letra }) => letra);

export function embaralhar(lista) {
  return [...lista].sort(() => Math.random() - 0.5);
}

export function sortear(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

export function criarAlternativas(resposta, quantidade = 4) {
  return embaralhar([resposta, ...embaralhar(letras.filter((letra) => letra !== resposta)).slice(0, quantidade - 1)]);
}

export function falar(texto) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = 'pt-BR';
  window.speechSynthesis.speak(fala);
}
