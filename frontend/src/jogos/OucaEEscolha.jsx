import { useState } from 'react';
import FraseECena from './ouca-e-escolha/FraseECena';
import CompleteAFrase from './ouca-e-escolha/CompleteAFrase';
import FrasesSonoras from './ouca-e-escolha/FrasesSonoras';
import DesafioBonus from './ouca-e-escolha/DesafioBonus';
import { useEtapa } from './useEtapa';

const fases = [
  { chave: 'frase-cena', numero: 1, icone: '📻', titulo: 'Rádio das Histórias', obrigatoria: true, Jogo: FraseECena },
  { chave: 'complete-frase', numero: 2, icone: '🎈', titulo: 'Balões de Palavras', obrigatoria: true, Jogo: CompleteAFrase },
  { chave: 'frases-sonoras', numero: 3, icone: '🚂', titulo: 'Frases Sonoras', obrigatoria: true, Jogo: FrasesSonoras },
  { chave: 'bonus-ouca', numero: 'BÔNUS', icone: '💎', titulo: 'Desafio Bônus', obrigatoria: false, Jogo: DesafioBonus },
];

export default function OucaEEscolha({ jogavel }) {
  const { concluidas, erro, carregar, atividadeId, concluir } = useEtapa('ouca-e-escolha');
  const [faseAberta, setFaseAberta] = useState(null);

  const aberta = fases.find((fase) => fase.chave === faseAberta);
  if (aberta) {
    const { Jogo, chave } = aberta;
    return <Jogo atividadeId={atividadeId(chave)} aoConcluir={() => { concluir(chave); setFaseAberta(null); }} aoFechar={() => setFaseAberta(null)} />;
  }

  function faseDisponivel(indice) {
    const fase = fases[indice];
    if (!jogavel) return false;
    if (!fase.obrigatoria) return concluidasObrigatorias === fases.filter((item) => item.obrigatoria).length;
    if (indice === 0) return true;
    return concluidas.includes(fases[indice - 1].chave);
  }

  const concluidasObrigatorias = fases.filter((fase) => fase.obrigatoria && concluidas.includes(fase.chave)).length;

  return <section className="current-world sentence-world" aria-labelledby="ouca-escolha-title">
    <header className="sentence-world-header"><div><span>🎧</span><section><small>ETAPA 3</small><h2 id="ouca-escolha-title">Ouça e Escolha</h2><p>Frases, escuta e leitura ativa.</p></section></div><b>⭐ {concluidasObrigatorias}/3</b></header>
    {erro && <p className="form-message" role="alert">{erro} <button className="text-link" type="button" onClick={carregar}>Tentar de novo</button></p>}
    <div className="sentence-world-activities">{fases.map(({ chave, numero, icone, titulo, obrigatoria }, indice) => {
      let acao;
      if (concluidas.includes(chave)) acao = <b className="phase-done">⭐ Feito!</b>;
      else if (!faseDisponivel(indice)) acao = <small className="phase-locked">🔒</small>;
      else if (!atividadeId(chave)) acao = <small className="phase-locked">Carregando...</small>;
      else acao = <button type="button" onClick={() => setFaseAberta(chave)}>▶ &nbsp; Jogar</button>;
      return <article className={`sentence-phase-card ${obrigatoria ? '' : 'bonus-phase'} ${!faseDisponivel(indice) ? 'locked-phase' : ''}`} key={chave}>
        <span className="sentence-phase-icon">{icone}</span><small>{numero === 'BÔNUS' ? numero : `FASE ${numero}`}</small><h3>{titulo}</h3>{acao}
      </article>;
    })}</div>
    <p className="sentence-world-note">Conclua as fases na ordem para liberar a próxima. O bônus é opcional.</p>
  </section>;
}
