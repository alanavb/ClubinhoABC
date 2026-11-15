// Voz da Web Speech API usada no site inteiro (jogos e histórias).
// Sem escolher a voz, o navegador usa a do idioma do sistema: num Windows em
// inglês, o português sai com sotaque inglês.

// femininas em pt-BR, da mais natural para a mais simples; Google por último
// porque não marca as palavras durante a leitura das histórias
const VOZES_PREFERIDAS = ['Francisca', 'Thalita', 'Maria', 'Luciana', 'Google'];

let vozEscolhida = null;
let avisouSemVoz = false;

function escolherVoz() {
  const vozes = window.speechSynthesis.getVoices();
  const doBrasil = vozes.filter((voz) => voz.lang.replace('_', '-').toLowerCase() === 'pt-br');
  const emPortugues = doBrasil.length ? doBrasil : vozes.filter((voz) => voz.lang.toLowerCase().startsWith('pt'));
  for (const nome of VOZES_PREFERIDAS) {
    const voz = emPortugues.find((opcao) => opcao.name.includes(nome));
    if (voz) return voz;
  }
  return emPortugues[0] ?? null;
}

if ('speechSynthesis' in window) {
  vozEscolhida = escolherVoz();
  // a lista de vozes chega depois do carregamento da página em alguns navegadores
  window.speechSynthesis.addEventListener('voiceschanged', () => { vozEscolhida = escolherVoz(); });
}

function avisarSemVozEmPortugues() {
  // lista ainda vazia = vozes não carregaram, não quer dizer que falta português
  if (avisouSemVoz || window.speechSynthesis.getVoices().length === 0) return;
  avisouSemVoz = true;
  window.dispatchEvent(new CustomEvent('clubinho:aviso', {
    detail: {
      mensagem: 'Este computador não tem voz em português. Para ouvir as atividades, use o Chrome ou o Edge, '
        + 'ou instale a voz Português (Brasil) nas configurações de fala do sistema.',
    },
  }));
}

export function criarFala(texto) {
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = 'pt-BR';
  if (vozEscolhida) fala.voice = vozEscolhida;
  else avisarSemVozEmPortugues();
  return fala;
}
