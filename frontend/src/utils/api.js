// Endereço base usado nas requisições ao back-end
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Esperas entre as tentativas. No plano gratuito do Render o back-end desliga
// depois de 15 min sem uso e leva de 30 s a 1 min para ligar de novo;
// as esperas somam cerca de 80 s para cobrir esse tempo sem mostrar erro.
const ESPERAS_ENTRE_TENTATIVAS_MS = [2000, 4000, 8000, 15000, 20000, 30000];

// Requisição com novas tentativas quando o servidor ainda está ligando
// (falha de rede ou erro 5xx). Só usada em chamadas que podem ser repetidas sem efeito duplicado.
export async function buscarComNovasTentativas(url, opcoes) {
  for (let tentativa = 0; ; tentativa += 1) {
    const ultima = tentativa === ESPERAS_ENTRE_TENTATIVAS_MS.length;
    try {
      const resposta = await fetch(url, opcoes);
      if (resposta.status < 500 || ultima) return resposta;
    } catch (erro) {
      if (ultima) throw erro;
    }
    await new Promise((resolver) => setTimeout(resolver, ESPERAS_ENTRE_TENTATIVAS_MS[tentativa]));
  }
}
