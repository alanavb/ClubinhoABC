// Voz em português usada nos jogos e nas histórias

// Prioridade de vozes femininas em português do Brasil
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
  // Atualiza a lista quando o navegador termina de carregá-la
  window.speechSynthesis.addEventListener('voiceschanged', () => { vozEscolhida = escolherVoz(); });
}

function avisarSemVozEmPortugues() {
  // Evita aviso antes de as vozes carregarem
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
