import { useState } from 'react';
import OuvirEEscolher from './caca-as-letras/OuvirEEscolher';
import ComQualLetraComeca from './caca-as-letras/ComQualLetraComeca';
import JogoDaMemoria from './caca-as-letras/JogoDaMemoria';
import Prova from './caca-as-letras/Prova';
import { useEtapa } from './useEtapa';

// requisito: chave da fase anterior que precisa estar concluída (null = sempre liberada)
const fases = [
  { chave: 'ouvir', icone: '🎧', titulo: 'Qual é a letra?', rotulo: 'FASE 1', requisito: null, obrigatoria: true, Jogo: OuvirEEscolher },
  { chave: 'palavra', icone: '⚽', titulo: 'Com qual letra começa?', rotulo: 'FASE 2', requisito: 'ouvir', obrigatoria: true, Jogo: ComQualLetraComeca },
  { chave: 'memoria', icone: '🧩', titulo: 'Jogo da memória', rotulo: 'FASE 3', requisito: 'palavra', obrigatoria: true, Jogo: JogoDaMemoria },
  { chave: 'bonus', icone: '💎', titulo: 'Desafio Bônus', rotulo: 'BÔNUS', requisito: null, obrigatoria: false, Jogo: Prova },
];

export default function CacaAsLetras({ jogavel }) {
  const { concluidas, erro, carregar, atividadeId, concluir } = useEtapa('caca-as-letras');
  const [faseAberta, setFaseAberta] = useState(null);
  const obrigatoriasFeitas = fases.filter((fase) => fase.obrigatoria && concluidas.includes(fase.chave)).length;

  const aberta = fases.find((fase) => fase.chave === faseAberta);

  return <section className="current-world" aria-labelledby="current-world-title">
    <header><div><div className="current-world-title"><span>🔤</span><div><small>ETAPA 1</small><h2 id="current-world-title">Caça às Letras</h2></div></div></div><b>⭐ {obrigatoriasFeitas}/3</b></header>
    {erro && <p className="form-message" role="alert">{erro} <button className="text-link" type="button" onClick={carregar}>Tentar de novo</button></p>}
    <div className="current-activities">{fases.map(({ chave, icone, titulo, rotulo, requisito, obrigatoria }) => {
      const bonusLiberado = !obrigatoria && obrigatoriasFeitas === fases.filter((fase) => fase.obrigatoria).length;
      const liberada = jogavel && (bonusLiberado || (obrigatoria && (!requisito || concluidas.includes(requisito))));
      const feita = concluidas.includes(chave);
      let acao;
      if (feita) acao = <small>⭐ Feito!</small>;
      else if (!liberada) acao = <small className="activity-locked">🔒</small>;
      else if (!atividadeId(chave)) acao = <small className="activity-locked">Carregando...</small>;
      else acao = <button type="button" onClick={() => setFaseAberta(chave)}>▶ &nbsp; Jogar</button>;
      return <article className={`activity-tile ${feita ? 'done' : liberada ? 'open' : 'blocked'}`} key={chave}>
        <span className="tile-icon">{icone}</span><span className="activity-phase-label">{rotulo}</span><h3>{titulo}</h3>{acao}
      </article>;
    })}</div>
    {aberta && <aberta.Jogo
      atividadeId={atividadeId(aberta.chave)}
      aoConcluir={() => concluir(aberta.chave)}
      aoFechar={() => setFaseAberta(null)}
    />}
  </section>;
}
