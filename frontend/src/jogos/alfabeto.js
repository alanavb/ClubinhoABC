import { criarFala } from '../utils/voz';

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

// algumas vozes leem CA, MA e UVA como sigla ("cê, á"); em minúsculas e com acento
// na única vogal ("cá"), a sílaba sai como um som só
function prepararTextoParaFala(texto) {
  if (!/^[A-ZÀ-ÖØ-Þ]{2,3}$/.test(texto)) return texto;
  const minusculo = texto.toLowerCase();
  const vogais = minusculo.match(/[aeiou]/g) || [];
  if (vogais.length !== 1) return minusculo;
  return minusculo.replace(vogais[0], vogaisAcentuadas[vogais[0]]);
}

export function falar(texto, velocidade = 1, aoTerminar = null) {
  if (!('speechSynthesis' in window)) {
    aoTerminar?.();
    return;
  }
  const sintetizador = window.speechSynthesis;
  // Cancelar sem haver fala em curso pode causar uma pausa desnecessária em
  // alguns navegadores. Só interrompemos quando realmente há algo para parar.
  if (sintetizador.speaking || sintetizador.pending) sintetizador.cancel();
  sintetizador.resume();
  // Mantém a voz brasileira preferida da main e os controles de ritmo/finalização
  // usados pelos jogos de sílabas e parlendas.
  const fala = criarFala(prepararTextoParaFala(texto));
  fala.rate = velocidade;
  if (aoTerminar) {
    fala.onend = aoTerminar;
    fala.onerror = aoTerminar;
  }
  sintetizador.speak(fala);
  sintetizador.resume();
}

// falar() duas vezes seguidas cortaria a primeira fala
export function falarEmSequencia(textos, velocidade = 1, aoTerminar = null) {
  if (!('speechSynthesis' in window)) {
    aoTerminar?.();
    return;
  }
  window.speechSynthesis.cancel();
  textos.forEach((texto, indice) => {
    const fala = criarFala(prepararTextoParaFala(texto));
    fala.rate = velocidade;
    if (indice === textos.length - 1 && aoTerminar) {
      fala.onend = aoTerminar;
      fala.onerror = aoTerminar;
    }
    window.speechSynthesis.speak(fala);
  });
}
