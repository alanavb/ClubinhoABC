import { useState } from 'react';
import FormeAPalavra from './monte-a-palavra/FormeAPalavra';
import SilabaQueFalta from './monte-a-palavra/SilabaQueFalta';
import PalavraEFigura from './monte-a-palavra/PalavraEFigura';
import ContarSilabas from './monte-a-palavra/ContarSilabas';
import { useEtapa } from './useEtapa';

const fases = [
  { chave: 'formar-palavra', numero: 1, icone: '🧩', titulo: 'Forme a palavra', obrigatoria: true, Jogo: FormeAPalavra },
  { chave: 'silaba-que-falta', numero: 2, icone: '🔍', titulo: 'Qual sílaba falta?', obrigatoria: true, Jogo: SilabaQueFalta },
  { chave: 'palavra-e-figura', numero: 3, icone: '📖', titulo: 'Leia e encontre', obrigatoria: true, Jogo: PalavraEFigura },
  { chave: 'bonus-monte', numero: 'BÔNUS', icone: '💎', titulo: 'Conte as sílabas', obrigatoria: false, Jogo: ContarSilabas },
];

const obrigatorias = fases.filter((fase) => fase.obrigatoria);

export default function MonteAPalavra({ jogavel }) {
  const { concluidas, erro, carregar, atividadeId, concluir } = useEtapa('monte-a-palavra');
  const [faseAberta, setFaseAberta] = useState(null);

  const aberta = fases.find((fase) => fase.chave === faseAberta);
  if (aberta) {
    const { Jogo, chave } = aberta;
    return <Jogo atividadeId={atividadeId(chave)} aoConcluir={() => { concluir(chave); setFaseAberta(null); }} aoFechar={() => setFaseAberta(null)} />;
  }

  const obrigatoriasFeitas = obrigatorias.filter((fase) => concluidas.includes(fase.chave)).length;

  // RN3: as obrigatórias abrem em sequência; o bônus só abre depois de todas elas.
  function liberada(indice) {
    if (!fases[indice].obrigatoria) return obrigatoriasFeitas === obrigatorias.length;
    return indice === 0 || concluidas.includes(fases[indice - 1].chave);
  }

  return <section className="current-world sentence-world" aria-labelledby="monte-palavra-title">
    <header className="sentence-world-header"><div><span>🧩</span><section><small>ETAPA 2</small><h2 id="monte-palavra-title">Monte a Palavra</h2><p>Sílabas que viram palavras.</p></section></div><b>⭐ {obrigatoriasFeitas}/{obrigatorias.length}</b></header>
    {erro && <p className="form-message" role="alert">{erro} <button className="text-link" type="button" onClick={carregar}>Tentar de novo</button></p>}
    <div className="sentence-world-activities">{fases.map(({ chave, numero, icone, titulo, obrigatoria }, indice) => {
      const pronta = Boolean(atividadeId(chave));
      let acao;
      if (concluidas.includes(chave)) acao = <b className="phase-done">⭐ Feito!</b>;
      else if (!jogavel || !liberada(indice)) acao = <small className="phase-locked">🔒</small>;
      else if (!pronta) acao = <small className="phase-locked">Carregando...</small>;
      else acao = <button type="button" onClick={() => setFaseAberta(chave)}>▶ &nbsp; Jogar</button>;
      return <article className={`sentence-phase-card ${obrigatoria ? '' : 'bonus-phase'} ${jogavel && liberada(indice) ? '' : 'locked-phase'}`} key={chave}>
        <span className="sentence-phase-icon">{icone}</span><small>{obrigatoria ? `FASE ${numero}` : numero}</small><h3>{titulo}</h3>{acao}
      </article>;
    })}</div>
    <p className="sentence-world-note">Conclua as fases na ordem para liberar a próxima. O bônus abre no final e é opcional.</p>
  </section>;
}
