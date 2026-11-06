export const palavrasDoAlfabeto = [
  ['A', 'Abelha', '🐝'], ['B', 'Bola', '⚽'], ['C', 'Casa', '🏠'], ['D', 'Dado', '🎲'],
  ['E', 'Elefante', '🐘'], ['F', 'Foca', '🦭'], ['G', 'Gato', '🐱'], ['H', 'Hipopótamo', '🦛'],
  ['I', 'Igreja', '⛪'], ['J', 'Jacaré', '🐊'], ['K', 'Kiwi', '🥝'], ['L', 'Lua', '🌙'],
  ['M', 'Macaco', '🐒'], ['N', 'Navio', '🚢'], ['O', 'Ovo', '🥚'], ['P', 'Pato', '🦆'],
  ['Q', 'Queijo', '🧀'], ['R', 'Rato', '🐭'], ['S', 'Sol', '☀️'], ['T', 'Tatu', '🦔'],
  ['U', 'Uva', '🍇'], ['V', 'Vaca', '🐮'], ['W', 'Waffle', '🧇'], ['X', 'Xícara', '☕'],
  ['Y', 'Yoga', '🧘‍♀️'], ['Z', 'Zebra', '🦓'],
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

const vogaisAcentuadas = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };

// Palavras curtas em maiúsculas (CA, MA, UVA) são lidas como siglas por algumas
// vozes do navegador, que soletram as letras ("cê, á"). Por isso o texto vai em
// minúsculas e, quando é uma sílaba (só uma vogal), a vogal recebe acento:
// "cá" é lido como um som só.
function prepararTextoParaFala(texto) {
  if (!/^[A-ZÀ-ÖØ-Þ]{2,3}$/.test(texto)) return texto;
  const minusculo = texto.toLowerCase();
  const vogais = minusculo.match(/[aeiou]/g) || [];
  if (vogais.length !== 1) return minusculo;
  return minusculo.replace(vogais[0], vogaisAcentuadas[vogais[0]]);
}

export function falar(texto) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const fala = new SpeechSynthesisUtterance(prepararTextoParaFala(texto));
  fala.lang = 'pt-BR';
  window.speechSynthesis.speak(fala);
}
